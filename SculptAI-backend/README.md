# SculptAI Backend

## Setup for Video File Serving

To properly serve the generated video files to the frontend, you need to configure the static file serving:

1. Create a `.env` file in the root of the SculptAI-backend directory (copy from `.env.example` if it exists)

2. Add the following environment variables to enable static file serving:

```
# Enable static file serving
MANIM_USE_STATIC_SERVING=true
MANIM_STATIC_URL_PREFIX=/videos
MANIM_OUTPUT_DIR=/manim-videos
```

3. Make sure the `MANIM_OUTPUT_DIR` points to the directory where the Manim renderer is saving the videos. This can be:
   - An absolute path (e.g., `/manim-videos` or `C:/manim-videos`)
   - A relative path from the project root (e.g., `./manim-videos`)

4. If needed, create the directory specified in `MANIM_OUTPUT_DIR` and ensure the application has write permissions to it.

5. Restart the backend server after making these changes.

## Video File Path Format

The videos returned by the backend will be accessible at:

`http://localhost:5000/videos/{filename}.mp4`

The frontend has been configured to handle these paths correctly.

## Testing Video Playback

To test if video serving is working properly:

1. Place a test video file (e.g., `test.mp4`) in your configured `MANIM_OUTPUT_DIR` directory.
2. Try accessing it directly in your browser at `http://localhost:5000/videos/test.mp4`
3. If the video plays in your browser, the static file serving is configured correctly.

## Troubleshooting

If videos are not displaying in the frontend:

1. Check the browser console for network errors
2. Verify that the video file exists in the specified directory
3. Ensure the correct path is being returned from the backend API
4. Check that the CORS settings allow the frontend to access the backend
5. Verify the permissions on the video directory and files 