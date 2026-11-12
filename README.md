# Arasya Plastic Engineering

Sites Worker ES module, with D1 for bilingual content and inquiries and R2 for uploaded images. Keep the Sites project owner-private. The administration screen uses the platform's owner access boundary and is available at /admin?lang=en or /admin?lang=ar.

Run npm run build and npm test with Node 24. The build produces dist/server/index.js. Use the Sites publishing workflow for the Site ID in .openai/hosting.json. The initial D1 migration is under drizzle/. The database initializes each locale separately the first time it is opened.

The bilingual CMS seed contains the reviewed local website content. Company and product information is sourced from https://arasyaplastic.com/. Assets include both company media and illustrations from the design references. Live inquiries and local database files are kept outside the repository.
