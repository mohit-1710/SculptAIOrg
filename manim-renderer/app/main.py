import os
import subprocess
import uuid
import shutil
import logging
from flask import Flask, request, jsonify
# from werkzeug.utils import secure_filename # Not strictly needed for code input
from dotenv import load_dotenv

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

os.makedirs(TEMP_RENDER_DIR, exist_ok=True)
os.makedirs(CONTAINER_OUTPUT_VIDEO_DIR, exist_ok=True) # Ensure this exists in container


logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


# --- Helper Functions ---
def generate_unique_id():
    return uuid.uuid4().hex

def save_locally_and_get_host_accessible_path(job_dir_in_container: str, 
                                              temp_video_path_in_container: str,
                                              output_dir_in_container: str,
                                              scene_identifier_for_filename: str):
    """
    Copies the rendered video to a designated output directory within the container
    (which is volume-mounted from the host) and returns a *conceptual* path
    or identifier that the calling service can use.
    For true accessibility, the Node.js service would need to know how to map this.
    For simplicity in this API response, we'll return the filename.
    """
    if not os.path.exists(temp_video_path_in_container):
        logging.error(f"Temporary video file not found at {temp_video_path_in_container}")
        return None

    # Create a more user-friendly filename
    final_video_filename = f"{scene_identifier_for_filename}_{generate_unique_id()}.mp4"
    final_video_path_in_container = os.path.join(output_dir_in_container, final_video_filename)

    try:
        shutil.copy(temp_video_path_in_container, final_video_path_in_container)
        logging.info(f"Video copied to container output directory: {final_video_path_in_container}")
        # This function now returns the FILENAME. The actual accessibility depends on the Docker mount.
        # The Node.js backend won't directly use this path to serve the file. It's more for confirmation.
        # The Node.js backend would know the host path where these are saved if it needs to list them or process them later.
        return final_video_filename # Return the filename for the response
    except Exception as e:
        logging.error(f"Error copying video to output directory {output_dir_in_container}: {e}")
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
            return jsonify({
                "error": "Manim rendering process failed.",
                "details_stdout": process.stdout,
                "details_stderr": process.stderr
            }), 500

        temp_video_path_in_container = os.path.join(job_dir, manim_output_relative_path)
        logging.info(f"Manim process completed for job {job_id}. Expected output: {temp_video_path_in_container}")

        if not os.path.exists(temp_video_path_in_container):
            logging.error(f"Manim output video not found for job {job_id} at: {temp_video_path_in_container}")
            logging.error(f"Manim STDOUT:\n{process.stdout}")
            logging.error(f"Manim STDERR:\n{process.stderr}")
            return jsonify({"error": "Manim output video file not found after rendering."}), 500

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