// src/api/validators/projectValidators.ts
import { z } from 'zod';
/**
 * Zod schema for validating the request body when creating/initiating a project
 * based on a user's idea.
 */
export const createProjectIdeaSchema = z.object({
    // We expect the request to have a 'body' object
    body: z.object({
        userIdea: z
            .string({
            required_error: 'User idea (userIdea) is required in the request body.',
            invalid_type_error: 'User idea must be a string.',
        })
            .min(10, 'User idea must be at least 10 characters long.')
            .max(1000, 'User idea must be at most 1000 characters long.'),
        // userId: z.string().uuid().optional(), // Example for when you add user IDs later
    }),
    // Define empty query and params as optional if not used by this specific schema,
    // to align with the structure the `validate` middleware expects.
    query: z.object({}).optional(),
    params: z.object({}).optional(),
});
/**
 * Zod schema for validating the request when generating video from a storyboard.
 * This validates both URL parameters (projectId) and the request body (storyboard, and optionally userIdea).
 */
export const generateVideoFromStoryboardSchema = z.object({
    // We expect the request to have URL parameters
    params: z.object({
        projectId: z
            .string({
            required_error: 'Project ID (projectId) is required in the URL path.',
            invalid_type_error: 'Project ID must be a string.',
        })
            .min(1, 'Project ID cannot be empty.'), // Or use .uuid() if your project IDs are UUIDs
    }),
    // We expect the request to have a 'body' object
    body: z.object({
        storyboard: z
            .array(z.object({
            scene_title: z.string({ required_error: 'Each scene must have a scene_title.' }).min(1),
            narration: z.string({ required_error: 'Each scene must have narration.' }).min(1),
            visual_description: z
                .string({ required_error: 'Each scene must have a visual_description.' })
                .min(1),
        }), {
            required_error: 'Storyboard array is required.',
            invalid_type_error: 'Storyboard must be an array of scene objects.',
        })
            .min(1, 'Storyboard must contain at least one scene.'),
        userIdea: z // Added userIdea here
            .string({
            // Optional: add required_error if it were mandatory and not optional
            invalid_type_error: 'User idea (userIdea) must be a string if provided.',
        })
            .min(1, 'User idea must be at least 1 character long if provided.') // Min length if provided
            .max(1000, 'User idea must be at most 1000 characters long if provided.')
            .optional(), // Make the userIdea field optional
    }),
    // We don't expect query parameters for this specific schema, make it optional.
    query: z.object({}).optional(),
});
//# sourceMappingURL=projectValidators.js.map