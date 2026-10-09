export const contactFields = [
  { id: `name`, label: `Name`, limit: 100, placeholder: `Your name` },
  { id: `email`, label: `Email`, limit: 254, placeholder: `you@example.com` },
  { id: `subject`, label: `Subject`, limit: 200, placeholder: `What can we help with?` },
  { id: `message`, label: `Message`, limit: 5000, placeholder: `Tell us a little more…` },
] as const;

export const contactTopics = [
  { id: `support`, label: `A little help`, copy: `Questions about your workspace or a registrar connection? Tell us where you got stuck.` },
  { id: `ideas`, label: `Your next idea`, copy: `A feature you would love, a detail we could improve, or something worth building together.` },
] as const;

export const contactDescription = `Need a hand with your domains, have an idea, or just want to say hello? We'd love to hear from you.`;
