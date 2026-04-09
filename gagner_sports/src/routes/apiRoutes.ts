import { Router } from 'express';
import * as eventCtrl from '../controllers/EventController';
import * as partCtrl from '../controllers/ParticipantController';
import * as payCtrl from '../controllers/PaymentController';
import * as contentCtrl from '../controllers/ContentController';
import * as sysCtrl from '../controllers/SystemController';
import * as mailCtrl from '../controllers/MailController';
import * as uploadCtrl from '../controllers/UploadController';

const router = Router();

// --- Health ---
router.get('/health', (req, res) => res.json({ status: 'alive' }));

// --- Events ---
router.get('/events', eventCtrl.getEvents);
router.post('/events-batch', eventCtrl.batchSaveEvents);
router.put('/events/:slug', eventCtrl.updateEvent);

// --- Participants ---
router.get('/participants', partCtrl.getParticipants);
router.post('/participants', partCtrl.createParticipant);
router.post('/participants-batch', partCtrl.batchParticipantUpdate);

// --- Payments (CC Avenue) ---
router.post('/payment/initiate', payCtrl.initiatePayment);
router.post('/payment/response', payCtrl.handlePaymentResponse);

// --- DMS (Content Management) ---
router.get('/content', (req, res, next) => { req.params.type = 'content'; next(); }, contentCtrl.getContentByType);
router.get('/dms/:type', contentCtrl.getContentByType);
router.post('/dms/:type', contentCtrl.createContent);
router.put('/dms/:type/:id', contentCtrl.updateContent);
router.delete('/dms/:type/:id', contentCtrl.deleteContent);
router.post('/dms/logo/upsert', contentCtrl.upsertLogo);

// --- Audit & Leaderboard ---
router.get('/audit', sysCtrl.getAuditLogs);
router.delete('/audit', sysCtrl.clearAuditLogs);

router.get('/leaderboard', sysCtrl.getLeaderboard);
router.post('/leaderboard', sysCtrl.updateLeaderboard);
router.delete('/leaderboard/:slug', sysCtrl.deleteLeaderboardEntry);

// --- Coupons (Placeholder) ---
router.get('/coupons', (req, res) => res.json([]));

// --- Emails ---
router.post('/bulk-email', mailCtrl.sendBulkEmail);
router.get('/smtp-status', mailCtrl.checkSmtpHealth);

// --- Uploads ---
router.post('/upload', uploadCtrl.uploadMiddleware, uploadCtrl.uploadMedia);

export default router;
