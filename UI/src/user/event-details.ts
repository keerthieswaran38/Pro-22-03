import { getEvents, getParticipants, saveParticipant, getCoupons, saveCoupons, Participant } from '../shared/utils/storage';
import { logAction } from '../shared/utils/auditLog';

declare const gsap: any;

// Helper for UI
const $ = (id: string) => document.getElementById(id);

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('id') || 'womens-day-run';
    
    // 🔥 ASYNC FETCH FROM MONGODB
    const events = await getEvents();
    const eventData = events[eventId];
    
    if (!eventData) return;

    // Populate UI
    if ($('ed-hero-title')) $('ed-hero-title')!.textContent = eventData.title;
    if ($('ed-hero-tag')) $('ed-hero-tag')!.textContent = eventData.tag;
    if ($('ed-date')) $('ed-date')!.textContent = eventData.date;
    if ($('ed-time')) $('ed-time')!.textContent = eventData.time;
    if ($('ed-venue')) $('ed-venue')!.textContent = eventData.venue;
    if ($('ed-description')) $('ed-description')!.innerHTML = `<p>${eventData.desc}</p>`;
    if ($('ed-bg-img')) ($('ed-bg-img') as HTMLImageElement).src = eventData.bgImg;
    if ($('success-event-name')) $('success-event-name')!.textContent = eventData.title;

    // Populate Categories Dropdown
    const selectDropdown = $('reg-category');
    if (selectDropdown) {
        selectDropdown.innerHTML = '';
        eventData.categories.forEach(cat => {
            selectDropdown.innerHTML += `<option value="${cat.name}">${cat.name} - ${cat.price}</option>`;
        });
    }

    // Form Handle
    const form = $('ed-registration-form') as HTMLFormElement;
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const couponCode = (formData.get('coupon') as string)?.toUpperCase();
            
            // Coupon Validation
            if (couponCode) {
                const coupons = await getCoupons();
                const coupon = coupons.find((c: any) => c.code === couponCode);
                if (!coupon || !coupon.active) {
                    alert('Invalid or Inactive Coupon!');
                    return;
                }
                if (coupon.usedCount >= coupon.maxUses) {
                    alert('Coupon usage limit reached!');
                    return;
                }
                // Update coupon count in MongoDB
                coupon.usedCount += 1;
                await saveCoupons(coupons);
                logAction('COUPON_USE', 'Public site', `Coupon ${couponCode} used for ${eventData.title}`);
            }

            // Save Participant to MongoDB
            const newPart: Participant = {
                id: 'p' + Date.now(),
                name: formData.get('name') as string,
                email: formData.get('email') as string,
                phone: formData.get('phone') as string,
                city: 'Unknown',
                gender: 'Other',
                ageGroup: 'Open',
                eventSlug: eventId,
                eventName: eventData.title,
                category: formData.get('category') as string,
                paymentStatus: 'Paid',
                registeredAt: new Date().toISOString()
            };
            
            await saveParticipant(newPart);
            
            logAction('REGISTRATION', 'Public Site', `New registration for ${eventData.title}: ${newPart.name}`);
            
            // Success animation
            if (typeof gsap !== 'undefined') {
                gsap.to('#ed-form-view', {
                    opacity: 0, x: -20, duration: 0.4, onComplete: () => {
                        const formView = $('ed-form-view');
                        const successView = $('ed-success-view');
                        if (formView) formView.style.display = 'none';
                        if (successView) {
                            successView.style.display = 'block';
                            gsap.fromTo(successView, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.5)' });
                        }
                    }
                });
            }
        });
    }
});
