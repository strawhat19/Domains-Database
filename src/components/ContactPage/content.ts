export const contactFields = [
  { id: `name`, label: `Name`, limit: 100, placeholder: `Your name` },
  { id: `email`, label: `Email`, limit: 254, placeholder: `you@example.com` },
  { id: `phone`, label: `Phone Number (Optional)`, limit: 40, placeholder: `Your phone number` },
  { id: `subject`, label: `Subject`, limit: 200, placeholder: `What can we help with?` },
  { id: `message`, label: `Message`, limit: 5000, placeholder: `Tell us a little more…` },
] as const;

export const contactTopics = [
  { id: `support`, label: `A little help`, copy: `Questions about your workspace or a registrar connection? Tell us where you got stuck.` },
  { id: `ideas`, label: `Your next idea`, copy: `A feature you would love, a detail we could improve, or something worth building together.` },
] as const;

export const contactDescription = `Questions about your domain portfolio, account, billing, or privacy? Contact the Domains Database team with the form when it is available.`;
