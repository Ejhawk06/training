# Weekly routine (runs every Sunday)

1. Next Monday's date is the week id (YYYY-MM-DD). Rotation week = (previous rotation week % 4) + 1, read from the latest `weeks/*/week.json`.
   If `weeks/<id>/` already exists (it was built early), don't rebuild it. Skip to step 8 and email that week, using the Doc link in `framework/drive.json`.
2. Read `framework/framework.json` (the rotation row for this week's theme and lane topics), `weeks/LOG.md` (everything already used), and the most recent `week.json` (copy its exact schema).
3. Research: run fresh web searches on the week's lane topics (telesales / final expense / IUL / mortgage protection trainers: Jeremy Miner NEPQ, Belfort, Voss, Hormozi, Jeb Blount, Andy Elliott, Cardone, David Duford, Cody Askins, plus current data). Pull at least one new, citable stat or technique per day. Don't repeat drills, objections, stats or "steal this line" lines that are in LOG.md. If rotation week 1 comes around again, keep the same lane themes but use all-new content.
4. Write `weeks/<id>/week.json` (same schema) and `weeks/<id>/captions.md`. Keep it simple, high energy, and specific to phone sales of FEX, IUL, trucker, veteran and mortgage protection policies. Keep it compliant: no rebating, no false promises, correct calling hours.
5. Build: `cd build && npm install && node build.mjs <id>`. Render-check the PDF pages and PNGs (no overflow, no clipped text).
6. Append the week to `weeks/LOG.md`. Commit and push to `claude/dazzling-euler-fsffl9`.
7. Google Drive: create a Google Doc named `Morning Training · Week of <dates> · <THEME>` in the folder "Crowning Point · Morning Training" (id in `framework/drive.json`) from `weeks/<id>/out/google-doc.html` (upload as text/html so it converts).
8. Email elijahhawk@crowningpoint.biz: subject `👑 Morning Training · Week of <dates> · <THEME>`. The body gives the week at a glance, the Google Doc link, the GitHub folder link for the PDF and graphics, and the Battle for the Crown objections for Thursday.
