# AI Instructions

1. When making code changes,
dont verify or test or build the code, 
just make minimal code changes and let the user look at the code diff and verify themselves before they commit.

2. Always try your best to structure code and imports like this:

code line 1
code line 2 - A
code line 3 - ABC

^ should be like a christmas tree where shortest line length is at the top going down to longest line length.

^ try your best to keep this structure its ok if it differs sometimes.

3. try to use SCSS over CSS whenever possible

4. in html or tsx or jsx, all elements should have a descriptive className and ID, especially if its rendered in a for loop or map. the ID can be like the Class but with the id or index of the element.
User should be able to inspect any element and see its class and then give that back to AI as reference.

5. when making buttons or clickable items, try your best to put icon text together. or icon only.

6. when making transitions, always prefer smooth transitions over flat static transitions.

7. prefer to break things out to make them more readable, like instead of:

<Text style={[styles.tabLabel, { color: timelineMode === value ? palette.blue : palette.muted }]} {...elementProps(`analytics-timeline-tab-label`, `${scope}-${value}`)}>{label}</Text>

or 

<Label className={`intro-eyebrow`} style={styles.eyebrow}>{`A LITTLE CLARITY GOES A LONG WAY`}</Label>

or

<Label className={`reset-confirmation-title`} style={styles.resetTitle}>{`Start fresh?`}</Label>

prefer like this

<Text 
    {...elementProps(`analytics-timeline-tab-label`, `${scope}-${value}`)} 
    style={[styles.tabLabel, { color: timelineMode === value ? palette.blue : palette.muted }]}
>
    {label}
</Text>

or this 

<Label className={`intro-eyebrow`} style={styles.eyebrow}>
    {`A LITTLE CLARITY GOES A LONG WAY`}
</Label>

or this

<Label className={`reset-confirmation-title`} style={styles.resetTitle}>
    {`Start fresh?`}
</Label>

8. in javascript or typescript or tsx or jsx, always use backticks whenever possible, if not then use single quotes, and double quotes as a last resort.

9. make apps with expo react native typescript sass with web and mobile, unless instructed to do otherwise (like angular or vue or next)

10. each app should either be a PWA or mobile app deployable to app store along with web so it can be put on a website with one of my custom domains

11. shared state should be managed either through context api for react or services with angular inside a shared/ folder, each app can have users, user, theme, etc. for example

12. each component should have its own folder, with logic, structure, and styles separated

13. footers should always include copyright with dynamic year and link to https://piratechs.com/

14. when an apps landing page is done being designed, and before the app is about to be published, it should have an About, Terms, Contact and Privacy Policy page, the menu links should lead to new pages, not # anchors, remove all those and replace with internal page links and include common redirects like about-us to about, contact-us to contact, etc.

15. before back end is hooked up, use local storage or device storage for CRUD operations to mock them or demo them, with one master variable called useLocalStorage true or false, set to true by default

16. every app should have sample data and an api/ with base route like this that lists the other routes import fs from 'fs';
import os from 'os';
import path from 'path';
import process from 'process';
import { NextResponse } from 'next/server';

export const GET = async () => {
  try {
    const uptime = process.uptime();
    const uptimeHours = Math.floor(uptime / 3600);
    const uptimeMinutes = Math.floor((uptime % 3600) / 60);

    const totalMem = os.totalmem() / (1024 * 1024 * 1024);
    const freeMem = os.freemem() / (1024 * 1024 * 1024);
    const usedMem = totalMem - freeMem;
    const cpuLoad = os.loadavg()[0];

    const getApiRoutes = (): string[] => {
      let routes: string[] = [];
      const apiDir = path.join(process.cwd(), `src`, `app`, `api`);

      const walk = (dir: string, baseRoute = ``) => {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            walk(fullPath, `${baseRoute}/${file}`);
          } else if (file.endsWith(`.ts`) || file.endsWith(`.js`)) {
            const srtRoute = `${baseRoute}/${file.replace(/\.ts$|\.js$/, ``)}`;
            const noIndexRoute = srtRoute.replaceAll(`index`, ``);
            const noidxrt = noIndexRoute;
            let apiRoute = noIndexRoute.replace(/^/, `/api${noidxrt == `` ? `` : ``}`);
            apiRoute = apiRoute?.replaceAll(`route`, ``);
            routes.push(apiRoute);
            routes?.sort();
          }
        });
      };

      if (process.env.NODE_ENV == `development`) walk(apiDir);
      return routes;
    };

    let defaultTitle = `Piratechs`;
    let defaultMessage = `API Server Connected`;

    return NextResponse.json({
      ok: true,
      status: 200,
      success: true,
      statusText: `ok`,
      title: defaultTitle,
      message: defaultMessage,
      datetime: new Date().toLocaleString(),
      stats: {
        cpuLoad: `${(cpuLoad ?? 0)?.toFixed(2)}`,
        uptime: `${uptimeHours} hours, ${uptimeMinutes} minutes`,
        memoryUsage: `${(usedMem ?? 0)?.toFixed(2)} GB of ${(totalMem ?? 0)?.toFixed(2)} GB`,
      },
      ...(process.env.NODE_ENV == `development` && { routes: getApiRoutes() }),
    });

  } catch (error) {
    return NextResponse.json({ error: `Server is in Error State` }, { status: 500 });
  }
};

17. when back end is hooked up and datbase is hooked up, or when using json from local storage device storage or json files or variables, and using those data to load elements like cards in the ui, each card should be a component, and have skeleton loading and a fetch to the internal app api equivalent for that data, then once the data is loaded remove the skeleton loading