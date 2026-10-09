import { internetHistoryArticle } from './history';

export type BlogSection = {
  id: string;
  title: string;
  bullets?: string[];
  paragraphs: string[];
};

export type BlogArticle = {
  slug: string;
  title: string;
  image: string;
  excerpt: string;
  category: string;
  imageAlt: string;
  takeaway: string;
  readMinutes: number;
  publishedAt: string;
  description: string;
  imageCaption: string;
  relatedSlugs: string[];
  sections: BlogSection[];
  sources: { label: string; url: string }[];
};

export const blogArticles: BlogArticle[] = [
  {
    category: `Basics`,
    readMinutes: 5,
    publishedAt: `2026-10-07`,
    slug: `domain-vs-hosting-vs-website`,
    title: `What Is a Domain? Domain vs Hosting vs Website Explained`,
    image: `/images/blog/domain-vs-hosting-vs-website.svg`,
    imageAlt: `Illustration of a website neighborhood with a domain street address, hosting plot, website house, and DNS directory`,
    imageCaption: `The domain is your address, hosting provides the space, the website is the house, and DNS helps visitors find it.`,
    excerpt: `Understand domains, hosting, websites, and DNS through a neighborhood analogy, then see how the pieces connect in a real setup.`,
    description: `Learn the difference between a domain, web hosting, a website, and DNS with a simple analogy, practical setup steps, and renewal and migration tips.`,
    takeaway: `A domain names the destination, hosting supplies the infrastructure, the website delivers the experience, and DNS connects the address to its services.`,
    relatedSlugs: [`how-to-choose-a-domain-name`, `domain-name-security`],
    sections: [
      {
        id: `imagine-a-website-neighborhood`,
        title: `Imagine a website as a house in a neighborhood`,
        paragraphs: [
          `Think of a domain name as a street address, hosting as the rented plot or space where a house stands, and the website as the house itself. Visitors use the address to find the destination, but the address does not contain the building. The rooms, furniture, and activities inside resemble your site's pages, images, content, forms, and other features.`,
          `DNS is the address directory or map that connects the name to the right destination. This is an analogy, not literal land ownership: hosting supplies actual computing infrastructure, storage, and network resources. A site may run across multiple servers. The comparison helps explain why registering an address, arranging hosting, and building the experience are separate jobs.`,
        ],
      },
      {
        id: `separate-the-three-main-parts`,
        title: `Domain vs hosting vs website: the three main parts`,
        paragraphs: [
          `A domain is a readable name such as example.com. You register the right to use an available name through a registrar and maintain that registration under its terms. Registration alone does not create a website. You can also use a domain for services such as email, or keep it registered while you prepare a future project.`,
          `Hosting makes your site's files and, when needed, application services available online. The website is the content and functionality visitors receive: a home page, product catalog, booking form, or blog. A website builder helps you create that experience and may include hosting. A registrar may sell all three, but these remain distinct services even when one company bundles them.`,
        ],
      },
      {
        id: `how-dns-connects-the-address`,
        title: `How DNS connects the address to the destination`,
        paragraphs: [
          `When someone opens a domain in a browser, DNS helps resolve the readable name to information used to reach the service. The browser can then request the website from its hosting infrastructure. DNS does not store your home page or write your articles; it helps clients find the services associated with the name.`,
          `Different records can support different destinations. Your main website, a subdomain, and domain email may use separate providers. Nameserver settings identify the authoritative DNS service for the domain, while records within that service describe particular destinations and related configuration. Keep track of both before making changes, especially if the provider hosting your site also manages its DNS.`,
        ],
      },
      {
        id: `a-practical-first-website-setup`,
        title: `A practical example: publishing your first website`,
        paragraphs: [
          `Imagine a fictional workshop called North Grove launching a site with service descriptions, photographs, and a contact form. The team first chooses a name and checks availability at a registrar. It then chooses hosting or a builder that supports the required pages and form, creates the content, and connects its registered domain using the hosting provider's instructions.`,
          `The team records which account controls each part and who maintains it. Before announcing the address, the owner should confirm the public pages, HTTPS setup, contact form, and any email service work as intended. An available domain is a starting point; a useful, functioning website requires the remaining pieces too.`,
        ],
        bullets: [
          `Register the chosen name and save its renewal details.`,
          `Arrange hosting and create the website's content and features.`,
          `Connect the domain using the provider's specific DNS instructions.`,
          `Confirm the website and connected services before sharing the address.`,
        ],
      },
      {
        id: `do-you-need-your-own-domain`,
        title: `Do you need your own domain and hosting?`,
        paragraphs: [
          `A public website needs infrastructure serving its content, but you do not always need to register your own domain. A platform may offer a site under its own subdomain, such as yourproject.platform.example in this fictional example. Hosting is still involved; the platform provides it and controls the parent domain.`,
          `Your own registered name gives you an address you can connect to compatible services you choose. A platform address can be useful when starting, but its availability and use depend on the platform's rules. Review custom-domain support, export options, and account ownership before building a project you expect to maintain for years.`,
        ],
      },
      {
        id: `move-hosting-keep-the-domain`,
        title: `Can you move hosting and keep the same domain?`,
        paragraphs: [
          `Yes. You can generally keep the domain registration while moving the website to compatible hosting. Prepare the site on the new provider, plan the necessary DNS changes, and follow both providers' migration instructions. Changing where a website runs does not inherently require changing its public name or transferring its registration to another registrar.`,
          `Preserve email and other service records during the move. Replacing nameservers without recreating needed records can disrupt services beyond the website. DNS caches can temporarily retain older information, so allow for that transition and keep the previous service available for the planned handover. Document which provider controls DNS after the move.`,
        ],
      },
      {
        id: `track-renewals-and-ownership`,
        title: `Track renewals and account ownership separately`,
        paragraphs: [
          `Domain registration, hosting, a builder subscription, and email may have separate renewal dates and billing arrangements. Paying for hosting does not necessarily renew the domain, and renewing the domain does not preserve a canceled hosting service. Even a bundled account deserves a review of which services and dates it includes.`,
          `Keep registrar and service-provider access secure, assign an accountable owner, and maintain backups of your website where appropriate. Domains Database can organize domain names, registrars, owners, renewal dates, and yearly costs. Confirm registration and renewal actions at the registrar, and maintain the hosting, website, DNS, and email details in their respective provider accounts.`,
        ],
      },
    ],
    sources: [
      { label: `MDN: What Is a Domain Name?`, url: `https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_domain_name` },
      { label: `MDN: What Is a Web Server?`, url: `https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_web_server` },
      { label: `ICANN: Registrar and Registration FAQs`, url: `https://www.icann.org/resources/pages/about-icann-faqs-2019-02-25-en` },
    ],
  },
  {
    category: `Naming`,
    readMinutes: 5,
    publishedAt: `2026-10-07`,
    slug: `how-to-choose-a-domain-name`,
    title: `How to Choose a Domain Name: A Practical Checklist`,
    image: `/images/blog/how-to-choose-a-domain-name.svg`,
    imageAlt: `Illustration of a browser searching northline.example above clear, memorable, and distinct naming criteria`,
    imageCaption: `A useful domain name is easy to recognize, explain, and maintain.`,
    excerpt: `Compare memorable names, avoid common naming mistakes, and choose an address that can grow with your project.`,
    description: `Learn how to choose a domain name with a practical checklist for spelling, brand fit, extensions, availability, and long-term ownership.`,
    takeaway: `Choose the name that your audience can remember and use, then confirm its registration details before building around it.`,
    relatedSlugs: [`domain-extensions-guide`, `domain-name-security`],
    sections: [
      {
        id: `start-with-the-project`,
        title: `Start with the project, audience, and scope`,
        paragraphs: [
          `Before searching for an available domain, write one sentence describing what the website will do and who it will serve. A personal photography portfolio, a local repair business, and an international software product need different naming choices. The sentence gives you a practical filter: a good candidate should support the actual project without requiring a long explanation.`,
          `List the words your audience already uses, along with a few distinctive brand ideas. Then decide how much room the name needs to grow. A name tied to one city or one product can be helpful when that focus is intentional, but awkward if the business later expands. Consider that tradeoff before checking which names are available.`,
        ],
      },
      {
        id: `make-it-easy-to-use`,
        title: `Make the address easy to say, spell, and recognize`,
        paragraphs: [
          `Say each candidate aloud, as if you were recommending the website over the phone. Ask someone to write it down without seeing it. If you must explain a missing vowel, a number that sounds like a word, or several hyphens, the address will require the same explanation from future visitors. A shorter name is useful only when it remains understandable.`,
          `Also look at the name in lowercase and in an email address. Two clear words can create an unexpected phrase when joined together. A fictional candidate such as northgrove.example is useful for this exercise: can someone separate the words correctly, recognize the business name, and copy the address without uncertainty? Compare full addresses instead of evaluating the name alone.`,
        ],
      },
      {
        id: `shortlist-and-compare`,
        title: `Use a small shortlist with consistent criteria`,
        paragraphs: [
          `Create three to five candidates and compare them against the same questions. This is more useful than collecting dozens of unrelated names. You can score each candidate from one to five for clarity, memorability, audience fit, and flexibility, but write a short reason beside every score. The reason matters more than a precise total.`,
          `For example, a neighborhood workshop might prefer a clear two-word name over an abstract invented word, while a product used across several industries may need a broader brand. Keep these as project-specific judgments. A name that sounds excellent to a founder may still confuse customers who hear it once or encounter it on a small screen.`,
        ],
        bullets: [
          `Can a first-time visitor spell it after hearing it?`,
          `Does it still make sense beside the chosen extension?`,
          `Will it fit the project you expect to run in a few years?`,
        ],
      },
      {
        id: `check-availability-and-history`,
        title: `Check availability, existing use, and registration terms`,
        paragraphs: [
          `An available registration is only one part of the decision. Search for existing organizations and products using the same or a similar name, and review the candidate's visible website history when it has been used before. Confusion with an established brand can become a practical obstacle even when a registrar lets you proceed. Pause unresolved naming conflicts before investing in design or launch materials.`,
          `For each finalist, read the registrar's registration and renewal terms, the extension's eligibility rules, and any premium renewal conditions. Record the registrar, renewal amount, and expiration date after registering. Availability and checkout details can change, so confirm the final address and terms in the registrar account rather than treating an earlier search result as a reservation.`,
        ],
      },
      {
        id: `domain-name-and-seo`,
        title: `Understand what a domain name contributes to SEO`,
        paragraphs: [
          `A descriptive name can help people understand what a site covers, but it cannot substitute for useful pages. Google describes an exact-match domain system that limits excessive credit for domains matching a search query. A long string of keywords is therefore a weak reason to choose an address that visitors find difficult to remember.`,
          `Plan the site around the questions your audience needs answered. Give each important page a clear purpose and title, write content that solves the problem, and connect related pages with meaningful links. Your domain supports this work by providing a consistent identity. It does not promise a ranking position, and a keyword in the address does not remove the need to earn attention.`,
        ],
      },
      {
        id: `finish-with-an-ownership-plan`,
        title: `Finish with a simple ownership plan`,
        paragraphs: [
          `Once you choose a name, assign an owner for the registrar account and a separate owner for ongoing administration if needed. Keep recovery details current, enable the registrar's available security controls, and decide how renewals will be reviewed. This is especially useful when a contractor launches the first version of the site or a team member later leaves.`,
          `In Domains Database, you can keep the domain, registrar, owner, renewal date, and yearly cost together, then export a CSV copy. Use that inventory to organize the decision and follow-up work. Registration and renewal actions still happen at the registrar, so confirm the account settings there before considering the new name ready for a public launch.`,
        ],
      },
    ],
    sources: [
      { label: `Google Search Central: Ranking Systems and Exact-Match Domains`, url: `https://developers.google.com/search/docs/appearance/ranking-systems-guide` },
      { label: `ICANN: Information for Domain Name Registrants`, url: `https://www.icann.org/registrants` },
    ],
  },
  {
    readMinutes: 5,
    category: `Portfolio`,
    publishedAt: `2026-10-07`,
    slug: `domain-portfolio-management`,
    title: `Domain Portfolio Management: Organize Renewals and Ownership`,
    image: `/images/blog/domain-portfolio-management.svg`,
    imageAlt: `Illustration of a portfolio dashboard with folders and domain records marked Renew, Review, and Keep`,
    imageCaption: `A clear inventory connects every domain to a purpose, owner, and renewal decision.`,
    excerpt: `Build a dependable domain inventory, keep registrar records accurate, and review renewals with a repeatable routine.`,
    description: `A practical domain portfolio management guide covering inventory fields, registrar reconciliation, renewal reviews, ownership, and CSV backups.`,
    takeaway: `Treat the inventory as a working record and the registrar as the authority for registration, billing, and renewal settings.`,
    relatedSlugs: [`domain-name-security`, `expired-domains-guide`],
    sections: [
      {
        id: `build-one-working-inventory`,
        title: `Build one working inventory for every domain`,
        paragraphs: [
          `Domain portfolio management starts with knowing which names you control and why you keep them. A portfolio can become fragmented across old spreadsheets, registrar accounts, and team members. Gather the domains into one working inventory before deciding what to renew, transfer, develop, or retire. Include inactive names: a domain with no visible website may still support email, redirects, or account recovery.`,
          `Use one row for each registered domain and a consistent spelling format. Record the registrar, accountable owner, expiration date, renewal cost, and intended use. Where a name appears in several exports, reconcile the duplicate instead of assuming there are two registrations. The goal is a record that another authorized person can understand without searching through old conversations.`,
        ],
        bullets: [
          `Identify the person responsible for each registration.`,
          `Record whether the name serves a site, email, redirect, or future project.`,
          `Keep passwords and API keys outside the inventory and its exports.`,
        ],
      },
      {
        id: `reconcile-with-registrars`,
        title: `Reconcile the inventory with your registrar accounts`,
        paragraphs: [
          `Your inventory is useful only when its important fields reflect current registrar records. Review each registrar account and compare the domain list, expiration dates, and renewal settings. Note differences and resolve them at the source. A domain recently transferred to another registrar can otherwise remain attached to the old account in a spreadsheet long after the move.`,
          `Domains Database supports manual records, CSV imports, and supported registrar connections to assemble a local inventory. Review imported records and confirm actual ownership before including them. The app's date-based status labels help organize attention, but they do not prove registration status. Check the registrar for billing changes or a renewal that has not yet appeared in your working record.`,
        ],
      },
      {
        id: `review-renewals-early`,
        title: `Review renewals before they become urgent`,
        paragraphs: [
          `Choose a recurring review time that fits your portfolio size. During each review, look ahead far enough to make decisions, update payment details, and involve the appropriate owner. A monthly review may be enough for a small set of names; a business with critical domains may need a tighter operational routine. The important feature is a named person completing it consistently.`,
          `Auto-renew can help, but confirm that it is enabled at the registrar and that the payment method remains valid. Editing an auto-renew preference in Domains Database changes the inventory record only. ICANN's renewal guidance also emphasizes keeping registrant contact information current so notices reach you. Do not rely on one reminder email or one screen as the entire renewal process.`,
        ],
      },
      {
        id: `decide-what-to-keep`,
        title: `Give every retained name a reason`,
        paragraphs: [
          `At renewal time, ask what the domain does today and what credible plan exists for it next. Useful categories include an active service, a redirect, a deliberate brand protection choice, and a project with an owner and timeline. If a name has no purpose, record that observation instead of carrying forward an old assumption that it will eventually become useful.`,
          `Before retiring a domain, check dependencies carefully. Look for email addresses, sign-in recovery messages, printed materials, software integrations, and redirects. For example, a closed campaign website may still receive customer emails or be listed on packaging. Assign someone to remove or replace those dependencies before deciding that a domain can safely be allowed to expire.`,
        ],
      },
      {
        id: `document-changes-and-handoffs`,
        title: `Document changes and team handoffs`,
        paragraphs: [
          `Make ownership and change history easy to follow. When the responsible person changes, update the inventory and the relevant registrar access or recovery settings. A company domain should not depend on the personal inbox of someone who left the team. Document the support route and account identifier in an appropriate private operational record without copying secrets into a shared domain list.`,
          `Schedule major registrar or DNS changes separately from routine inventory cleanup. Capture the current setup, identify services using the domain, and agree on the desired result before making changes. Afterward, update the inventory with the actual registrar and dates. This avoids a common mistake: marking a planned transfer as complete before the registrar has completed it.`,
        ],
      },
      {
        id: `keep-a-portable-backup`,
        title: `Keep a portable backup and a compact review checklist`,
        paragraphs: [
          `Export the inventory after significant changes and keep a dated copy in a suitable private location. Domains Database stores its inventory in the current browser or device, so clearing browser data or moving to another device is a reason to prepare a backup. A CSV preserves the working records; it does not replace registrar account access or renew the names in it.`,
          `End each review with a short checklist: names reconciled, upcoming renewals assigned, payment and contact details checked, unused domains reviewed, and a backup exported. Record unresolved items with an owner and next step. This small routine is easier to maintain than a complex process nobody follows, and it makes your portfolio more understandable as the number of domains grows.`,
        ],
      },
    ],
    sources: [
      { label: `ICANN: Domain Name Renewals and Expiration FAQs`, url: `https://www.icann.org/resources/pages/domain-name-renewal-expiration-faqs-2018-12-07-en` },
      { label: `ICANN: Information for Domain Name Registrants`, url: `https://www.icann.org/registrants` },
    ],
  },
  {
    readMinutes: 5,
    category: `Evaluation`,
    publishedAt: `2026-10-07`,
    slug: `domain-name-valuation`,
    title: `Domain Name Valuation: How to Evaluate a Name's Practical Fit`,
    image: `/images/blog/domain-name-valuation.svg`,
    imageAlt: `Illustration of a domain assessment comparing name quality, comparable sales, and buyer context beside a balance`,
    imageCaption: `A structured evaluation makes assumptions visible before you commit to a name.`,
    excerpt: `Evaluate domain quality with a useful framework for audience fit, usability, history, comparable evidence, and uncertainty.`,
    description: `Explore practical domain name valuation factors, including memorability, audience fit, extension choice, history, and the limits of automated estimates.`,
    takeaway: `Evaluate the name for a specific use case, distinguish evidence from assumptions, and keep domain quality separate from website performance.`,
    relatedSlugs: [`how-to-choose-a-domain-name`, `expired-domains-guide`],
    sections: [
      {
        id: `define-what-you-are-evaluating`,
        title: `Define what you are evaluating`,
        paragraphs: [
          `Domain name valuation becomes clearer when you first define the question. Are you comparing names for a new project, deciding whether to renew a portfolio entry, or reviewing a proposed purchase? Those decisions require different evidence. A name can be a strong fit for one organization and a poor fit for another, even when its spelling and extension remain the same.`,
          `Separate the domain registration from any website, content, customer relationships, or verified revenue offered alongside it. An address alone does not demonstrate that those additional assets exist or transfer with the name. Write down what is included and what is unknown before comparing alternatives. This guide offers a qualitative evaluation process rather than a monetary appraisal.`,
        ],
      },
      {
        id: `assess-clarity-and-memorability`,
        title: `Assess clarity, memorability, and audience fit`,
        paragraphs: [
          `Start with how people will use the name. Can your intended audience pronounce it, spell it, and recognize it after a short encounter? A concise word may be difficult to communicate when it has several plausible spellings. A slightly longer phrase may perform better in everyday use because it tells visitors exactly what to expect. Look for friction rather than a fixed character-count rule.`,
          `Consider whether the words match a real product, service, or brand direction. For a fictional outdoor workshop, a clear name connected to repairs could support the customer journey more directly than an unrelated abstract term. For a company with several products, a broader brand might be easier to extend. Record the project-specific reason instead of declaring either style universally superior.`,
        ],
      },
      {
        id: `evaluate-the-full-address`,
        title: `Evaluate the full address and its alternatives`,
        paragraphs: [
          `Read the name and extension together. An extension can support the audience's expectations, but it may also require extra explanation or have registration restrictions. Compare the complete address with realistic alternatives you could actually use. Include a fresh brand option, a descriptive option, and a suitable extension choice. This helps reveal whether the preferred candidate solves a meaningful problem.`,
          `Record registration and renewal terms for each alternative without assuming an introductory offer represents ongoing cost. Also consider operational complexity: will a name require several defensive registrations, explanation in advertising, or a later rebrand? These are practical planning factors. They help you understand the burden of a choice without turning a subjective preference into a supposedly precise market value.`,
        ],
      },
      {
        id: `review-history-and-evidence`,
        title: `Review history and verify claims separately`,
        paragraphs: [
          `For a previously used domain, review archived pages, current search results, and any available evidence of past use. Look for abrupt topic changes, spam, impersonation, or a reputation you would not want attached to the project. An old registration date tells you about time, not whether the name was well maintained or whether its previous content served readers.`,
          `If someone presents traffic, search visibility, or business performance as part of the evaluation, ask for dated evidence and a clear explanation of what is measured. Page performance scores and popularity ranks are different from verified visitor counts. Keep each claim in its own category so a technical metric is not accidentally interpreted as an audience, a customer base, or a guarantee.`,
        ],
      },
      {
        id: `understand-estimate-limitations`,
        title: `Treat comparisons and automated estimates as inputs`,
        paragraphs: [
          `Reported transactions and automated appraisal tools may give you ideas about characteristics to examine, but they cannot settle the fit of a particular name. Different buyers have different constraints, and public transaction records may omit context or accompanying assets. An advertised asking amount also reflects a seller's request; it is not evidence that a comparable transaction completed on those terms.`,
          `Be equally careful with SEO claims. Google uses many ranking signals and limits excessive credit for exact-match domain names. A keyword-rich address is therefore insufficient evidence of future search visibility. Evaluate the content plan, audience, and implementation separately. If the case for a name depends entirely on an estimate or a ranking promise, identify that dependence before making a decision.`,
        ],
      },
      {
        id: `create-an-evaluation-worksheet`,
        title: `Create a decision worksheet you can revisit`,
        paragraphs: [
          `Use a compact worksheet with the candidate, intended use, alternatives, strengths, concerns, and evidence dates. Give each factor a plain-language assessment such as strong, acceptable, or unresolved. Keep the reasoning beside the assessment. A spreadsheet full of scores can appear objective while hiding the assumptions that produced them; a few clear notes are often more useful.`,
          `Finish by writing the conditions that would change your decision. You might need clearer ownership evidence, a better understanding of renewal terms, or confirmation that the audience understands the name. Revisit those conditions before committing. For existing portfolio names, the same worksheet can explain a renewal decision and help the next reviewer understand why the name was retained.`,
        ],
        bullets: [
          `Name the actual project and audience.`,
          `Compare complete addresses and credible alternatives.`,
          `Separate documented facts from estimates and preferences.`,
          `Record unanswered questions and the next action for each.`,
        ],
      },
    ],
    sources: [
      { label: `Google Search Central: A Guide to Ranking Systems`, url: `https://developers.google.com/search/docs/appearance/ranking-systems-guide` },
      { label: `ICANN: Registrant Rights and Responsibilities`, url: `https://www.icann.org/registrants` },
    ],
  },
  {
    readMinutes: 5,
    category: `Lifecycle`,
    publishedAt: `2026-10-07`,
    slug: `expired-domains-guide`,
    title: `Expired Domains Guide: Lifecycle, Recovery, and Due Diligence`,
    image: `/images/blog/expired-domains-guide.svg`,
    imageAlt: `Illustration of a domain timeline from registration through expiration, grace, redemption, and release`,
    imageCaption: `An expired domain can pass through several stages before it becomes available.`,
    excerpt: `Understand what expiration means, what to do if your domain lapses, and what to review before using a previously registered name.`,
    description: `Learn how expired domains work, why recovery windows vary, how to contact your registrar, and what to examine before acquiring a previously used domain.`,
    takeaway: `Expiration is a process with provider-specific details. Act promptly on your own names and investigate a candidate's history before using it.`,
    relatedSlugs: [`domain-portfolio-management`, `domain-name-security`],
    sections: [
      {
        id: `what-expiration-means`,
        title: `What does it mean when a domain expires?`,
        paragraphs: [
          `A domain expires when its paid registration term ends without a completed renewal. That does not necessarily mean anyone can immediately register it. A registrar may have post-expiration procedures, and a registry may apply additional lifecycle stages. The path depends on the extension, provider, and current status. Always distinguish an expiration date from an actual availability result.`,
          `The website may disappear, show a parking page, or stop working while the domain remains in an expired or recovery state. Email can also be affected. If the name supports an active business, do not wait for a visible outage to investigate. Review the registrar account directly and read the provider's documented renewal and restoration process for that particular name.`,
        ],
      },
      {
        id: `understand-the-lifecycle`,
        title: `Understand the lifecycle without assuming one timeline`,
        paragraphs: [
          `ICANN's Expired Registration Recovery Policy establishes renewal and restoration requirements for generic top-level domains. Its registrant summary describes a 30-day Redemption Grace Period following deletion and notes that a registrar may offer an earlier Auto Renew Grace Period. Those stages are different: expiration, deletion, and public availability are not interchangeable events.`,
          `Do not apply a generic timeline to every extension or auction listing. Country-code registries can have their own rules, and registrar terms affect what happens before deletion. An auction or backorder can also have conditions that differ from a normal new registration. Confirm the current status and provider terms rather than calculating a guaranteed release date from the expiration date alone.`,
        ],
      },
      {
        id: `recover-your-own-domain`,
        title: `If your own domain expired, contact the registrar promptly`,
        paragraphs: [
          `Start with the registrar that currently holds the registration. Sign in using its known website, inspect the domain status, and look for its renewal or restoration instructions. If access is unavailable, use the registrar's official support channel. Explain the domain, the account you used, and when you noticed the problem. Keep receipts and previous registration records available for the support process.`,
          `Ask which recovery options remain, what the relevant deadlines are, and whether additional restoration charges apply. Do not assume that buying a hosting plan, editing DNS, or paying an unfamiliar emailed invoice will recover the domain. Once the registration is restored, confirm the website and email setup with the appropriate provider, then correct the payment or contact issue that caused the lapse.`,
        ],
      },
      {
        id: `research-a-previously-used-name`,
        title: `Research a previously used name before acquiring it`,
        paragraphs: [
          `When evaluating an expired candidate, begin with the name's suitability for your actual project. Then review archived pages, visible search results, and the current registration status. Look for unexplained changes in subject matter, misleading pages, malware warnings, or associations that could confuse your audience. Keep dated notes, because search results and archived snapshots offer partial views of the history.`,
          `Treat backlinks and third-party quality scores as research prompts rather than proof of a healthy domain. Examine the context of important links and whether they make sense for the proposed website. Also clarify what an acquisition includes. Control of a registration does not automatically include the previous site's text, images, accounts, or brand identity. Build the new project around materials you can use.`,
        ],
        bullets: [
          `Confirm the current status and acquisition conditions.`,
          `Review past content and major changes in purpose.`,
          `Investigate reputation concerns before proceeding.`,
          `Separate the domain from any additional assets offered.`,
        ],
      },
      {
        id: `avoid-seo-shortcut-assumptions`,
        title: `Avoid treating an expired domain as an SEO shortcut`,
        paragraphs: [
          `A previously registered name does not guarantee search visibility for a new website. Google defines expired domain abuse as repurposing an expired name primarily to manipulate rankings with content offering little value. Evaluate the intended site on its own merits: who needs it, what questions will it answer, and why will those answers be useful?`,
          `If you use an older name for a legitimate project, create accurate pages with a clear identity and purpose. Do not imitate the former organization or publish unrelated material solely to exploit old links. Historical signals and third-party scores cannot replace original content, clear navigation, or a functioning service. A good acquisition decision should still make sense without a promise of inherited rankings.`,
        ],
      },
      {
        id: `prevent-the-next-expiration`,
        title: `Prevent the next missed renewal`,
        paragraphs: [
          `After registering or recovering a name, record its actual registrar, owner, expiration date, and renewal terms. Set a review routine and confirm the registrar's auto-renew setting and payment details. Keep renewal messages flowing to an active inbox that the responsible person monitors. An administrative process is particularly important when the domain supports other accounts or a shared business identity.`,
          `Domains Database can organize those fields and provide a portable CSV inventory. Keep the registrar account as the source for actual renewal actions and status. If you decide to retire a name, first remove email, account recovery, and service dependencies. Deliberate retirement is easier to manage than an accidental lapse followed by an urgent attempt to recover a still-needed address.`,
        ],
      },
    ],
    sources: [
      { label: `ICANN: Five Things to Know About Expired Registration Recovery`, url: `https://www.icann.org/resources/pages/registrant-about-errp-2018-12-07-en` },
      { label: `Google Search Central: Expired Domain Abuse`, url: `https://developers.google.com/search/docs/essentials/spam-policies#expired-domain` },
    ],
  },
  {
    readMinutes: 5,
    category: `Security`,
    publishedAt: `2026-10-07`,
    slug: `domain-name-security`,
    title: `Domain Name Security: Protect Your Registrar Account and DNS`,
    image: `/images/blog/domain-name-security.svg`,
    imageAlt: `Illustration of a domain browser with a shield and lock beside account access, registrar lock, and DNS checks`,
    imageCaption: `Domain security combines account protection, careful administration, and recovery planning.`,
    excerpt: `Protect the account behind your website with clear ownership, secure recovery details, transfer controls, and a response plan.`,
    description: `A domain name security checklist for registrar accounts, multi-factor authentication, transfer locks, DNS changes, renewal scams, and incident response.`,
    takeaway: `Protect the registrar account and its recovery inbox, document access, and use the security controls supported by your providers.`,
    relatedSlugs: [`domain-portfolio-management`, `expired-domains-guide`],
    sections: [
      {
        id: `map-the-accounts-behind-the-domain`,
        title: `Map the accounts behind the domain`,
        paragraphs: [
          `A domain connects several services, and protecting it requires knowing which account controls each one. The registrar manages the registration. A DNS provider may manage where the name points. Hosting and email providers run the services reached through those records. These roles can belong to one company or several, so draw a simple map before changing passwords or delegating administration.`,
          `Record the accountable owner and official support route for each provider in a private operational record. Identify who can renew the domain, change nameservers, edit DNS, and recover the accounts. This makes a routine handoff easier and gives you somewhere to start during an incident. Keep credentials out of domain notes, public profiles, shared articles, and CSV exports.`,
        ],
      },
      {
        id: `protect-account-access`,
        title: `Protect account access and recovery`,
        paragraphs: [
          `Use a unique password for the registrar account and enable its supported multi-factor authentication. Secure the recovery email account as well. ICANN recommends keeping a registration contact email independent of the registered domain; this can preserve a recovery route when the domain's own email stops working. Maintain current contact information and monitor the inbox used for account notices.`,
          `Store recovery codes according to the provider's instructions in an appropriate private location, and document how an authorized person can use the recovery process if the main administrator is unavailable. When a provider offers separate team access, use that mechanism instead of circulating one shared password. Review access when contractors or employees finish their work, and remove permissions they no longer need.`,
        ],
      },
      {
        id: `use-transfer-controls`,
        title: `Use transfer controls with a clear change process`,
        paragraphs: [
          `Ask the registrar which transfer-lock and other protection options it supports. A transfer lock adds a control against an unauthorized transfer, but the exact implementation varies. Understand what the lock blocks and how it is removed. It is one layer of protection, and account access still needs attention because an attacker with sufficient privileges may be able to change settings.`,
          `For a planned transfer, confirm the destination, responsible person, provider instructions, and any applicable restrictions before temporarily changing protection settings. Treat authorization codes as sensitive. After the transfer finishes, confirm the resulting registration and available security settings. Keep a short record of the completed action so a later warning or notice can be compared with an authorized change.`,
        ],
      },
      {
        id: `manage-dns-changes-carefully`,
        title: `Manage DNS changes carefully`,
        paragraphs: [
          `A nameserver or DNS-record change can affect website traffic, email delivery, and service verification. Capture the existing configuration, document the intended change, and involve the people responsible for affected services. Avoid editing records you do not understand simply because they look old. A seemingly unused TXT or MX record may support an integration or mail configuration that is still important.`,
          `DNSSEC adds cryptographic authentication to DNS data so validating resolvers can detect forged responses. It does not encrypt website traffic or replace account protection. Follow the DNS provider and registrar's instructions when enabling it or changing DNS providers; the chain of trust must remain consistent. When uncertain, arrange the change with the providers instead of guessing at signature or delegation settings.`,
        ],
      },
      {
        id: `recognize-renewal-and-phishing-scams`,
        title: `Recognize renewal and account phishing attempts`,
        paragraphs: [
          `Domain owners can receive convincing messages that imitate a registrar, demand an urgent payment, or request credentials. ICANN's security guidance highlights these renewal and phishing scams. When a message asks you to act, open the registrar through a known bookmark or its official address and review the account there. Compare the domain, registrar, and expiration date with your existing records.`,
          `Unexpected urgency is a reason to investigate, not a reason to skip your normal process. Ask the official support channel about unfamiliar invoices or account changes. Also watch for misleading offers to register another extension: read exactly what is being sold and whether it is related to the domain you already control. A legitimate-looking logo does not establish the sender's authority.`,
        ],
        bullets: [
          `Open account notices through the provider's known website.`,
          `Check the address, domain, and requested action carefully.`,
          `Report unfamiliar changes through official support.`,
          `Keep payment details and account secrets out of replies.`,
        ],
      },
      {
        id: `prepare-an-incident-plan`,
        title: `Prepare an incident plan before you need it`,
        paragraphs: [
          `Write a short response plan naming the registrar, DNS provider, recovery contact, and person responsible for escalation. Preserve registration receipts and relevant change records securely. If you suspect unauthorized access or a transfer, contact the registrar promptly through its official channel. Describe the unexpected changes and preserve the messages or timestamps that may help support investigate.`,
          `Use the provider's recovery instructions to secure the account and review affected services. Reassess access, recovery information, DNS settings, and renewal details after the incident is resolved. Keep your inventory updated so another authorized administrator can find the domain and provider quickly. A practiced, simple process is easier to use under pressure than undocumented knowledge held by one person.`,
        ],
      },
    ],
    sources: [
      { label: `ICANN: Protecting a Domain Against Hijacking and Unauthorized Transfers`, url: `https://www.icann.org/en/blogs/details/do-you-have-a-domain-name-heres-what-you-need-to-know-26-3-2018-en` },
      { label: `ICANN: Important Tips to Help Keep Your Domain Name Secure`, url: `https://www.icann.org/en/system/files/files/help-keep-domain-name-secure-30sep20-en.pdf` },
      { label: `Cloudflare: How DNSSEC Works`, url: `https://www.cloudflare.com/learning/dns/dnssec/how-dnssec-works/` },
    ],
  },
  {
    readMinutes: 5,
    category: `Extensions`,
    publishedAt: `2026-10-07`,
    slug: `domain-extensions-guide`,
    title: `Domain Extensions Explained: How to Choose the Right TLD`,
    image: `/images/blog/domain-extensions-guide.svg`,
    imageAlt: `Illustration of a globe connected to .com, .org, .dev, .io, .us, and .co domain extension cards`,
    imageCaption: `Choose an extension around your audience, eligibility, and ongoing registration terms.`,
    excerpt: `Compare generic and country-code extensions, understand their search implications, and evaluate the full address before registering.`,
    description: `Understand domain extensions and top-level domains, including generic TLDs, country-code TLDs, audience fit, eligibility, renewals, and SEO considerations.`,
    takeaway: `Choose a recognizable, eligible extension that suits your audience and a name you can maintain over time.`,
    relatedSlugs: [`how-to-choose-a-domain-name`, `domain-name-valuation`],
    sections: [
      {
        id: `what-is-a-domain-extension`,
        title: `What is a domain extension or top-level domain?`,
        paragraphs: [
          `The top-level domain, or TLD, is the final part of a domain name. In example.com, it is .com. People often call this the domain extension. Some registration options use an additional label under a TLD, such as addresses ending in .co.uk. Compare the complete registered address when evaluating choices, because the visible suffix may contain more than one part.`,
          `IANA's Root Zone Database lists delegated top-level domains and their managers. It distinguishes categories including generic and country-code TLDs. That directory is useful for understanding who manages an extension, while the relevant registry and registrar provide the actual registration requirements. A suffix appearing in a search tool does not by itself explain whether you qualify to register it.`,
        ],
      },
      {
        id: `generic-and-country-code-choices`,
        title: `Compare generic and country-code choices`,
        paragraphs: [
          `Generic extensions include familiar options such as .com and .org, along with extensions associated with a subject or industry. A descriptive suffix can make a complete address meaningful when it fits the project. Evaluate whether your intended visitors recognize it and whether you will need to repeat or explain it in conversations, printed materials, or email addresses.`,
          `Country-code extensions connect to a country or territory, though some are widely used beyond that association. Their eligibility, registration, and renewal policies can differ. For a website focused on one country, the local extension may be an appropriate audience cue. For a project serving several markets, compare the operational implications of one main domain versus several localized sites.`,
        ],
      },
      {
        id: `extension-choice-and-seo`,
        title: `Understand how extension choice relates to SEO`,
        paragraphs: [
          `Google's guidance says keywords in a generic TLD do not provide a search ranking advantage or disadvantage. Choosing a suffix associated with your service can therefore be a communication decision, without treating it as a shortcut to visibility. Compare names on audience comprehension, practical usability, and the website you can build behind the address.`,
          `Google also documents country-code domains as a signal of country targeting, with some country-code extensions treated as generic exceptions. If international search matters to the project, read the current guidance for the specific extension and site structure. Language and country are separate concerns: a website in Spanish may serve several countries, and one country may have audiences using several languages.`,
        ],
      },
      {
        id: `review-terms-and-eligibility`,
        title: `Review eligibility and ongoing registration terms`,
        paragraphs: [
          `Before registering, check whether the extension has eligibility conditions, verification requirements, or restrictions on the name you want. Then compare the registration and renewal terms at the registrar. Ask whether the chosen name has special renewal conditions and how transfers or restoration work. These details are easier to understand before checkout than during an urgent renewal or migration.`,
          `For a team, assign someone to maintain the information needed by the registry and registrar. A choice that depends on a particular organization, location, or qualification deserves an ongoing owner. Keep a record of the extension, registrar, expiration date, and recurring cost in your portfolio so you can review the name using actual terms rather than its original promotional presentation.`,
        ],
      },
      {
        id: `test-the-complete-address`,
        title: `Test the complete address with your audience`,
        paragraphs: [
          `Create a shortlist and compare the full address in realistic settings: a search result, an email signature, a small mobile header, and a spoken recommendation. Ask a few people from the intended audience what they think the site offers and how they would type the address. Listen for assumptions, such as automatically adding a more familiar extension.`,
          `A creative combination may work well when both sides of the dot form a clear idea, but make sure the result remains understandable without special formatting. Consider common spelling mistakes and the language your audience uses. Choose an option you can present consistently in your logo, navigation, and messages rather than relying on visitors to remember an unusual explanation every time.`,
        ],
        bullets: [
          `Read the name and extension aloud as one address.`,
          `Check whether the audience understands the site's purpose.`,
          `Compare eligibility and renewal terms for each finalist.`,
          `Consider the countries and languages the site will serve.`,
        ],
      },
      {
        id: `plan-a-manageable-domain-set`,
        title: `Plan a manageable set of domains`,
        paragraphs: [
          `You may decide to register an additional extension or common variant, but give every extra name a purpose. Assign its owner, document where it redirects, and include it in renewal reviews. A large collection of unused variants introduces more administration. Decide which choices reduce actual visitor confusion and which merely reflect a possibility you have not evaluated.`,
          `Keep one clearly identified primary website address and document how any supporting domains are used. If you later change the primary domain, plan the site move, email dependencies, and redirects before announcing it. Domains Database can keep the resulting names and renewal records together, while registration and DNS changes remain actions you confirm with the relevant registrar and service providers.`,
        ],
      },
    ],
    sources: [
      { label: `IANA: Root Zone Database`, url: `https://www.iana.org/domains/root/db` },
      { label: `Google Search Central: Handling of New Top-Level Domains`, url: `https://developers.google.com/search/blog/2015/07/googles-handling-of-new-top-level` },
      { label: `Google Search Central: Managing Multi-Regional and Multilingual Sites`, url: `https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites` },
    ],
  },
  internetHistoryArticle,
];

export const featuredBlogArticle = blogArticles[0];
export const historyBlogArticle = internetHistoryArticle;
export const regularBlogArticles = blogArticles.filter(article => article.slug !== featuredBlogArticle.slug && article.slug !== historyBlogArticle.slug);

export const getBlogArticle = (slug: string) => blogArticles.find(article => article.slug === slug);
