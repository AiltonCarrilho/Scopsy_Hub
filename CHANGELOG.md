# Changelog

## [1.4.0](https://github.com/AiltonCarrilho/Scopsy_Hub/compare/v1.3.0...v1.4.0) (2026-03-07)


### Features

* **jornada:** restore Gold Standard UI + new sessions API with RLS ([e8b2ed9](https://github.com/AiltonCarrilho/Scopsy_Hub/commit/e8b2ed9e91a5f41fe3211e8d5bf418d957595f58))
* optimize RLS - remove from public exercise tables ([3ff0b20](https://github.com/AiltonCarrilho/Scopsy_Hub/commit/3ff0b20ef41e588c3eacdd1813835dc1d062649e))


### Bug Fixes

* Add missing await for updateInBoostspace in login endpoint ([6557d3a](https://github.com/AiltonCarrilho/Scopsy_Hub/commit/6557d3aeb4de5f12b212035f33f7fded25dce85e))
* convert user_id to INTEGER in journey endpoints for RLS policy compliance ([12cacfe](https://github.com/AiltonCarrilho/Scopsy_Hub/commit/12cacfe3b93a38b353cd2fda415ddaba71d00dbf))
* **frontend:** add Authorization header to all journey API requests ([35a1dae](https://github.com/AiltonCarrilho/Scopsy_Hub/commit/35a1daeefb7a366cb44dc9e92ab9bcab97b4503e))
* **journey:** add auth token to nextSession progress call ([b8f7bb6](https://github.com/AiltonCarrilho/Scopsy_Hub/commit/b8f7bb62ef72d9ec84952124781152b0bc5ed058))
* **journey:** correct JSON structure mapping - decision_options and is_optimal ([c3bb2eb](https://github.com/AiltonCarrilho/Scopsy_Hub/commit/c3bb2eb018d514c74624c096c1c31d5e32fb6a5e))
* **journey:** correct relative path for data/journeys - 2 levels up ([b3e4da3](https://github.com/AiltonCarrilho/Scopsy_Hub/commit/b3e4da375c80f85417b67a028516c1f8ec9eec22))
* **journey:** load JSON sessions from deployable path ([89411e2](https://github.com/AiltonCarrilho/Scopsy_Hub/commit/89411e2d796e6c55c04527af7cf23846052cd3ef))
* **journey:** load sessions from JSON files instead of empty DB table ([93ef9c1](https://github.com/AiltonCarrilho/Scopsy_Hub/commit/93ef9c1f373e3bb14a19092d86974f4ed14dd390))
* **journey:** load sessions from Orchestrator JSON files, not Supabase ([0f3e6f5](https://github.com/AiltonCarrilho/Scopsy_Hub/commit/0f3e6f5a41f9ac051391819483d1cb2953c35a71))
* **journey:** map UUID journey IDs to Orchestrator numeric IDs ([23e97b0](https://github.com/AiltonCarrilho/Scopsy_Hub/commit/23e97b07851d1e5ef4aaf745c6c8f2dfcdcaf0be))
* **journey:** remove duplicate broken route with req.user.id bug ([75df341](https://github.com/AiltonCarrilho/Scopsy_Hub/commit/75df3417e247c4000d18e9ad3f44f09a0a184000))
* **journey:** resolve critical security vulnerabilities F.3 and F.2 ([95945b4](https://github.com/AiltonCarrilho/Scopsy_Hub/commit/95945b4704b2fb55489f86684c28c03a7b1f9aad))
* **journey:** use maybeSingle for optional progress checks ([7b7c3a7](https://github.com/AiltonCarrilho/Scopsy_Hub/commit/7b7c3a7b10c58a1967a7d759b2c5750c02727945))
* **m3:** complete jornada terapeutica database repair - add schema columns, explode JSONB sessions, fix RLS ([56c8c2f](https://github.com/AiltonCarrilho/Scopsy_Hub/commit/56c8c2fa6afece4e2a5094809d26a1a3807c7fc0))
* Vercel deployment - correct API rewrite URL ([a0934fa](https://github.com/AiltonCarrilho/Scopsy_Hub/commit/a0934fa8d45f34c6cda5f9737cf95c4d7922a888))
* **vercel:** add rewrite for /frontend/* to root for backward compatibility ([75112d9](https://github.com/AiltonCarrilho/Scopsy_Hub/commit/75112d992544dba01f27cd31cc2dc14b32ba590d))
* **vercel:** disable cleanUrls to prevent 308 redirects on .html files ([06b6497](https://github.com/AiltonCarrilho/Scopsy_Hub/commit/06b64979bb9078d89b17fc23a7627af8d968def2))
* **vercel:** point API rewrite to scopsy-hub backend ([e1b1f4d](https://github.com/AiltonCarrilho/Scopsy_Hub/commit/e1b1f4d53c58c05c87619f56055cc5ad5cc4f5b5))


### Performance Improvements

* **journey:** add in-memory cache for sessions, orchestrator IDs, and DB rows ([82cb471](https://github.com/AiltonCarrilho/Scopsy_Hub/commit/82cb47191e2f5b790ca66547e6df5cbd4e11a8f4))
