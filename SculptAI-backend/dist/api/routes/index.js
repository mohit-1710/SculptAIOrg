// src/api/routes/index.ts
import { Router } from 'express';
import projectRoutes from './projectRoutes.js'; // Import projectRoutes with .js
/**
 * Main API Router.
 * This router aggregates all other feature-specific routers.
 * It will be mounted by the main Express app (`app.ts`) under a base path
 * (e.g., /api/v1, as defined in the config).
 */
const router = Router();
/**
 * @route   GET /status
 * @desc    Health check for this specific API router module.
 *          When mounted under config.api.prefix (e.g., /api/v1), this becomes /api/v1/status.
 * @access  Public
 */
router.get('/status', (req, res) => {
    res.status(200).json({
        status: 'API router is healthy and responsive',
        timestamp: new Date().toISOString(),
    });
});
// --- Mount feature-specific routers below ---
router.use('/projects', projectRoutes); // <--- THIS LINE IS NOW ACTIVE
// Add more routers as your API grows:
// router.use('/users', userRoutes);
// router.use('/auth', authRoutes);
export default router;
//# sourceMappingURL=index.js.map