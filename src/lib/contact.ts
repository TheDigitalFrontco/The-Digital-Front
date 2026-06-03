/* Central contact + conversion links. Reused by every "Start a Project" CTA
   (hero, mid-page, footer) and the footer socials. */

export const EMAIL = 'create@thedigitalfront.co'

/* WhatsApp number, digits only (used to build the wa.me link).
   Leave empty to hide the WhatsApp CTA. */
export const WHATSAPP_NUMBER = '96170622335'
/* Human-readable form shown in the UI. */
export const WHATSAPP_DISPLAY = '+961 70 622 335'

const WHATSAPP_MESSAGE = "Hi, I'd like to discuss a project I have in mind."

export const whatsappHref = WHATSAPP_NUMBER
  ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`
  : ''

export const mailtoHref = `mailto:${EMAIL}?subject=${encodeURIComponent(
  'New project enquiry',
)}`

/* Web3Forms access key — powers the contact form (guaranteed email delivery on a
   static host). Safe to commit: it only permits submissions to the inbox it's
   bound to. Submissions land at the email used to create the key. */
export const WEB3FORMS_ACCESS_KEY = '30ff3b82-9b29-47c5-acd4-8424290e248a'

export const SOCIALS = [
  { label: '@thedigitalfront.co', href: 'https://instagram.com/thedigitalfront.co', platform: 'instagram' },
  { label: '@thedigitalfront', href: 'https://tiktok.com/@thedigitalfront', platform: 'tiktok' },
  { label: 'The Digital Front', href: 'https://www.facebook.com/profile.php?id=61590220487323', platform: 'facebook' },
] as const
