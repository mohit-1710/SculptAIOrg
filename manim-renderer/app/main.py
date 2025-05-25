import os
import subprocess
import uuid
import shutil
import logging
import re # Import re for regex parsing
from flask import Flask, request, jsonify
# from werkzeug.utils import secure_filename # Not strictly needed for code input
from dotenv import load_dotenv
from google.cloud import storage

# --- Load Environment Variables ---
load_dotenv('../.env') # Load .env from the parent directory relative to app/main.py

# --- Application Setup ---
app = Flask(__name__)

# --- Configuration (from environment variables) ---
# Directory *inside the container* where videos will be saved before being accessible on the host via mount
# This path will be mapped from a host directory when running `docker run`.
CONTAINER_OUTPUT_VIDEO_DIR = os.environ.get("CONTAINER_OUTPUT_VIDEO_DIR", "/output_videos")
# Ensure this directory exists within the container if Manim doesn't create it (usually not needed if job_dir is used)
# os.makedirs(CONTAINER_OUTPUT_VIDEO_DIR, exist_ok=True) # Not strictly needed if we copy from job_dir

TEMP_RENDER_DIR = os.environ.get("TEMP_RENDER_DIR", "/tmp/manim_jobs")
MANIM_QUALITY_FLAG = os.environ.get("MANIM_QUALITY_FLAG", "-ql")
MANIM_SCENE_CLASS_NAME = os.environ.get("MANIM_SCENE_CLASS_NAME", "GeneratedScene")
MANIM_EXECUTION_TIMEOUT = int(os.environ.get("MANIM_EXECUTION_TIMEOUT_SECONDS", "300"))

# Google Cloud Storage configuration
GCS_PROJECT_ID = os.environ.get("GCS_PROJECT_ID")
GCS_BUCKET_NAME = os.environ.get("GCS_BUCKET_NAME")
GCS_CREDENTIALS_FILE = os.environ.get("GCS_KEY_FILE")
USE_CLOUD_STORAGE = bool(os.environ.get("USE_CLOUD_STORAGE", "False").lower() == "true" and GCS_BUCKET_NAME)
GCS_BASE_URL = os.environ.get("GCS_BASE_URL", f"https://storage.googleapis.com/{GCS_BUCKET_NAME}" if GCS_BUCKET_NAME else "")

os.makedirs(TEMP_RENDER_DIR, exist_ok=True)
os.makedirs(CONTAINER_OUTPUT_VIDEO_DIR, exist_ok=True) # Ensure this exists in container

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Initialize Google Cloud Storage client if configured
storage_client = None
if USE_CLOUD_STORAGE:
    try:
        if GCS_CREDENTIALS_FILE:
            storage_client = storage.Client.from_service_account_json(GCS_CREDENTIALS_FILE)
        else:
            storage_client = storage.Client(project=GCS_PROJECT_ID)
        logging.info(f"Google Cloud Storage initialized for bucket: {GCS_BUCKET_NAME}")
    except Exception as e:
        logging.error(f"Failed to initialize Google Cloud Storage: {e}")
        storage_client = None
else:
    logging.info("Google Cloud Storage is not configured or disabled.")

# --- Helper Functions ---
def generate_unique_id():
    return uuid.uuid4().hex

def save_locally_and_get_host_accessible_path(job_dir, temp_video_path, output_dir, scene_identifier):
    """
    Copy the video file from the temporary job directory to the output directory
    that's mounted from the host, making it accessible there.
    Returns the filename of the saved file.
    """
    try:
        # Make sure source file exists
        if not os.path.exists(temp_video_path):
            logging.error(f"Source video file not found: {temp_video_path}")
            return None
        
        # Create a unique filename based on scene identifier
        # Use the scene_identifier as a prefix for the filename, but add a hash for uniqueness
        base_name = f"{scene_identifier}_{generate_unique_id()[:8]}.mp4"
        
        # Destination path in the container output directory
        dest_path = os.path.join(output_dir, base_name)
        
        # Copy the file to the mounted directory
        shutil.copy2(temp_video_path, dest_path)
        
        if not os.path.exists(dest_path):
            logging.error(f"Failed to copy to destination: {dest_path}")
            return None
            
        logging.info(f"Video saved to {dest_path} (accessible on host)")
        
        return base_name
    except Exception as e:
        logging.error(f"Error saving video to host-accessible location: {e}")
        return None

def upload_to_cloud_storage(local_file_path, scene_identifier):
    """
    Upload a file to Google Cloud Storage and return the public URL.
    """
    if not storage_client or not GCS_BUCKET_NAME:
        logging.error("Cannot upload to Google Cloud Storage: client or bucket not configured")
        return None
    
    try:
        # Create a unique filename based on scene identifier
        filename = os.path.basename(local_file_path)
        base_name, extension = os.path.splitext(filename)
        
        # Use the scene_identifier as a prefix for the filename, but add a hash for uniqueness
        destination_blob_name = f"videos/{scene_identifier}_{generate_unique_id()[:8]}{extension}"
        
        # Get bucket
        bucket = storage_client.bucket(GCS_BUCKET_NAME)
        
        # Upload file
        blob = bucket.blob(destination_blob_name)
        blob.upload_from_filename(local_file_path)
        
        # Make the blob publicly accessible
        blob.make_public()
        
        # Get the public URL
        video_url = blob.public_url
        
        logging.info(f"Uploaded {local_file_path} to {destination_blob_name} in bucket {GCS_BUCKET_NAME}")
        logging.info(f"Public URL: {video_url}")
        
        return video_url
    except Exception as e:
        logging.error(f"Error uploading to Google Cloud Storage: {e}")
        return None

def parse_manim_errors(stderr: str, stdout: str) -> dict:
    """
    Attempts to parse common errors from Manim's stderr.
    Returns a dictionary with a parsed_error message and a type if an error is identified,
    otherwise None.
    """
    parsed_error_summary = None
    error_type = "UNKNOWN_MANIM_ERROR"

    # Common Manim errors (can be expanded)
    if "No scene found" in stderr or "No scene named" in stderr or "module 'scene_script' has no attribute" in stderr:
        parsed_error_summary = "Manim rendering failed: The specified scene class was not found in the script."
        error_type = "SCENE_NOT_FOUND"
    elif "ModuleNotFoundError" in stderr:
        match = re.search(r"ModuleNotFoundError: No module named '([^']*)'", stderr)
        module_name = match.group(1) if match else "unknown"
        parsed_error_summary = f"Manim rendering failed: A required Python module ('{module_name}') was not found. Please ensure all necessary imports are included and correct."
        error_type = "MODULE_NOT_FOUND"
    elif "NameError" in stderr:
        match = re.search(r"NameError: name '([^']*)' is not defined", stderr)
        name = match.group(1) if match else "unknown"
        parsed_error_summary = f"Manim rendering failed: A name ('{name}') was used before it was defined. Check for typos or missing variable/object initializations."
        error_type = "NAME_ERROR"
    elif "AttributeError" in stderr:
        match = re.search(r"AttributeError: '([^']*)' object has no attribute '([^']*)'", stderr)
        obj_type = match.group(1) if match else "unknown"
        attr_name = match.group(2) if match else "unknown"
        parsed_error_summary = f"Manim rendering failed: An attempt was made to access an attribute ('{attr_name}') on an object ('{obj_type}') that doesn't have it."
        error_type = "ATTRIBUTE_ERROR"
    elif "ManimPangoCairoError" in stderr or "TEX SCENE" in stdout: # Checking stdout too for some TeX issues
        # This is a broad category, could be made more specific
        parsed_error_summary = "Manim rendering failed: There was an issue with text rendering (Pango/Cairo) or LaTeX compilation. Check your text elements and LaTeX expressions."
        error_type = "TEXT_RENDERING_OR_TEX_ERROR"
    elif "FileNotFoundError" in stderr and "assets" in stderr:
        parsed_error_summary = "Manim rendering failed: An asset file (e.g., image, sound) was not found. Ensure all asset paths are correct and files are accessible."
        error_type = "ASSET_NOT_FOUND"
    elif "shaders" in stderr.lower() and ("error" in stderr.lower() or "failed" in stderr.lower()):
        parsed_error_summary = "Manim rendering failed: There was an issue with shaders, possibly related to OpenGL or complex graphical operations."
        error_type = "SHADER_ERROR"
    
    # Add more specific parsers as needed

    if parsed_error_summary:
        return {"parsed_error": parsed_error_summary, "error_type": error_type}
    return None

# --- API Endpoint ---
@app.route("/render", methods=["POST"])
def render_manim_scene_endpoint():
    if not request.is_json:
        logging.warning("Received non-JSON request to /render")
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    manim_code = data.get("manim_code")
    scene_identifier = data.get("scene_identifier", "untitled_scene")

    if not manim_code or not isinstance(manim_code, str):
        logging.warning(f"Missing or invalid 'manim_code' for scene: {scene_identifier}")
        return jsonify({"error": "Missing or invalid 'manim_code' (must be a string)"}), 400

    # --- Lint the Manim code ---
    # Create a temporary file for linting
    temp_lint_file_path = None
    try:
        import tempfile
        with tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".py", encoding="utf-8") as tmp_script:
            tmp_script.write(manim_code)
            temp_lint_file_path = tmp_script.name
        
        lint_process = subprocess.run(
            ["flake8", "--select=F,E9", "--ignore=F403,F405", temp_lint_file_path], # Focus on fatal (F) and syntax errors (E9xx), ignore star import warnings
            capture_output=True,
            text=True,
            encoding="utf-8"
        )

        if lint_process.returncode != 0:
            logging.warning(f"Linting failed for scene {scene_identifier}. Flake8 stdout:\\n{lint_process.stdout}")
            # Clean up the temporary lint file
            if temp_lint_file_path and os.path.exists(temp_lint_file_path):
                os.remove(temp_lint_file_path)
            return jsonify({
                "error": "Linting failed for the provided Manim code.",
                "details_stdout": lint_process.stdout,
                "details_stderr": lint_process.stderr # Though flake8 usually outputs to stdout
            }), 400 # Bad request due to code quality issues
        
        # Clean up the temporary lint file if linting passed
        if temp_lint_file_path and os.path.exists(temp_lint_file_path):
            os.remove(temp_lint_file_path)
            temp_lint_file_path = None # Reset path

    except Exception as lint_e:
        logging.error(f"Error during linting setup or execution for scene {scene_identifier}: {lint_e}")
        if temp_lint_file_path and os.path.exists(temp_lint_file_path):
            os.remove(temp_lint_file_path)
        return jsonify({"error": "Server error during code linting."}), 500
    # --- End Linting ---

    job_id = generate_unique_id()
    job_dir = os.path.join(TEMP_RENDER_DIR, job_id) # Temp working dir for Manim
    
    quality_dir_name = "480p15" # Default for -ql
    if MANIM_QUALITY_FLAG == "-qm": quality_dir_name = "720p30"
    elif MANIM_QUALITY_FLAG == "-qh": quality_dir_name = "1080p60"
    # ... other quality flags

    # Expected relative path *within job_dir* where Manim saves the video
    manim_output_relative_path = os.path.join("media", "videos", "scene_script", quality_dir_name, f"{MANIM_SCENE_CLASS_NAME}.mp4")
    script_filename = "scene_script.py"
    script_path = os.path.join(job_dir, script_filename)

    logging.info(f"Starting Manim render job {job_id} for scene: {scene_identifier}")

    try:
        os.makedirs(job_dir, exist_ok=True)
        with open(script_path, "w", encoding="utf-8") as f:
            f.write(manim_code)

        manim_command = [
            "python", "-m", "manim",
            script_path,
            MANIM_SCENE_CLASS_NAME,
            MANIM_QUALITY_FLAG,
            "--media_dir", os.path.join(job_dir, "media"), # Manim outputs here
            # No need for --output_file if we rely on default naming based on ClassName
        ]
        logging.info(f"Executing Manim for job {job_id}: {' '.join(manim_command)}")

        process = subprocess.run(
            manim_command,
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=MANIM_EXECUTION_TIMEOUT
        )

        if process.returncode != 0:
            logging.error(f"Manim rendering failed for job {job_id}. Code: {process.returncode}")
            logging.error(f"Manim STDOUT:\n{process.stdout}")
            logging.error(f"Manim STDERR:\n{process.stderr}")
            
            parsed_error_info = parse_manim_errors(process.stderr, process.stdout)
            response_payload = {
                "error": "Manim rendering process failed.",
                "details_stdout": process.stdout,
                "details_stderr": process.stderr
            }
            if parsed_error_info:
                response_payload["parsed_error"] = parsed_error_info["parsed_error"]
                response_payload["error_type"] = parsed_error_info["error_type"]
                logging.error(f"Parsed Manim Error for job {job_id}: {parsed_error_info['error_type']} - {parsed_error_info['parsed_error']}")

            return jsonify(response_payload), 500

        temp_video_path_in_container = os.path.join(job_dir, manim_output_relative_path)
        logging.info(f"Manim process completed for job {job_id}. Expected output: {temp_video_path_in_container}")

        if not os.path.exists(temp_video_path_in_container):
            logging.error(f"Manim output video not found for job {job_id} at: {temp_video_path_in_container}")
            logging.error(f"Manim STDOUT:\n{process.stdout}")
            logging.error(f"Manim STDERR:\n{process.stderr}")
            return jsonify({"error": "Manim output video file not found after rendering."}), 500

        # If cloud storage is configured, upload the video to Google Cloud Storage
        if USE_CLOUD_STORAGE and storage_client:
            video_url = upload_to_cloud_storage(temp_video_path_in_container, scene_identifier)
            
            if video_url:
                logging.info(f"Manim scene {scene_identifier} (job {job_id}) rendered and uploaded to Google Cloud Storage: {video_url}")
                
                return jsonify({
                    "message": "Manim scene rendered and uploaded to Google Cloud Storage.",
                    "video_url": video_url,
                    "scene_identifier": scene_identifier
                }), 200
            else:
                logging.error(f"Failed to upload video to Google Cloud Storage for job {job_id}.")
                # Fall back to local storage if cloud upload fails
        
        # Save the file to the designated (mounted) output directory
        # The CONTAINER_OUTPUT_VIDEO_DIR is what will be mapped from your host.
        saved_filename = save_locally_and_get_host_accessible_path(
            job_dir, 
            temp_video_path_in_container,
            CONTAINER_OUTPUT_VIDEO_DIR,
            scene_identifier
        )

        if not saved_filename:
            logging.error(f"Failed to copy video to final output directory for job {job_id}.")
            return jsonify({"error": "Failed to save rendered video locally in container."}), 500

        logging.info(f"Manim scene {scene_identifier} (job {job_id}) rendered and saved as {saved_filename} in mounted volume.")
        
        # IMPORTANT: The 'video_url' here is conceptual for the Node.js backend.
        # The Node.js backend will NOT be ables to directly access this container path.
        # It's more of a confirmation that the file was saved with this name.
        # For true URL access, you'd need another service to serve these files from the host, or S3.
        return jsonify({
            "message": "Manim scene rendered and saved to host-mounted volume.",
            "video_filename_on_host": saved_filename, # This is the filename saved on the host
            "container_save_path": os.path.join(CONTAINER_OUTPUT_VIDEO_DIR, saved_filename), # For debugging
            "scene_identifier": scene_identifier
        }), 200

    except subprocess.TimeoutExpired:
        logging.error(f"Manim rendering timed out for job {job_id} (scene: {scene_identifier}).")
        return jsonify({"error": "Manim rendering process timed out."}), 504
    except Exception as e:
        logging.error(f"Unexpected error for job {job_id} (scene: {scene_identifier}): {e}", exc_info=True)
        return jsonify({"error": "Unexpected server error during rendering."}), 500
    finally:
        if os.path.exists(job_dir):
            try:
                shutil.rmtree(job_dir)
                logging.info(f"Cleaned up temporary job directory: {job_dir}")
            except Exception as e:
                logging.error(f"Error cleaning up temp directory {job_dir}: {e}")

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "Manim Renderer is healthy"}), 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    debug_mode = os.environ.get("FLASK_DEBUG", "0") == "1"
    logging.info(f"Starting Manim Renderer in {'debug' if debug_mode else 'production'} mode on port {port}")
    app.run(host="0.0.0.0", port=port, debug=debug_mode)    