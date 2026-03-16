## Deploy to Google Cloud Console (Cloud Run)

Below is a **step‑by‑step guide** to deploy RehearsAI as a static frontend on **Google Cloud Run** using the **Google Cloud Console** (almost everything is done from the browser).

### 1. Prepare your local project

- **Build the production bundle**:

```bash
npm install
npm run build
```

This creates a `dist` folder with the static files that will be served in production.

> RehearsAI is a **frontend‑only** app. In production you just need to serve the contents of `dist` over HTTPS.

### 2. Create and configure your Google Cloud project

1. Go to the Google Cloud Console (`https://console.cloud.google.com`).
2. In the top bar, click on **Select a project** → **New Project**.
3. Choose a **Project name** (e.g. `rehearsai-prod`) and click **Create**.
4. Make sure **billing** is enabled for this project (Cloud Run requires an active billing account, even if the free tier covers most usage).
5. In the top bar, ensure the newly created project is selected.

### 3. Enable the required APIs

Still in the Cloud Console, with your project selected:

1. Open the left sidebar and go to **APIs & Services → Library**.
2. Enable:
   - **Cloud Run Admin API**
   - **Cloud Build API**
   - **Artifact Registry API**

### 4. Configure environment variables (Gemini API key)

You will pass your `GEMINI_API_KEY` as a **Cloud Run environment variable**:

1. In the left sidebar, go to **Security → Secret Manager**.
2. Click **Create secret**.
3. Name: `GEMINI_API_KEY`.
4. Value: your Gemini API key.
5. Click **Create**.

You will attach this secret to the Cloud Run service in a later step.

### 5. Create a containerized static server (Cloud Buildpacks + Express)

Cloud Run needs a container image. The easiest way (without Dockerfile) is to let **Cloud Build** generate it from your source.  
This repo incluye:

- un pequeño servidor Express (`server.cjs`) que sirve el contenido estático de `dist` y escucha en `PORT`
- un `Procfile` con:

```text
web: npm start
```

Los buildpacks de Node detectan ese `Procfile` y configuran automáticamente el comando de arranque del contenedor.

```bash
npm run build        # genera dist
npm start            # arranca Express en process.env.PORT (8080 en Cloud Run)
```

1. Push your project to a Git repository (GitHub, GitLab or Cloud Source Repositories).
2. In Cloud Console, go to **Cloud Run**.
3. Click **Create service**.
4. In **Deployment platform**, select your preferred region (e.g. `us-central1`).
5. In **Source**, choose **Source repository**:
   - Connect your GitHub/GitLab repo if needed.
   - Select the repository and branch where RehearsAI lives.
6. For **Build and Deployment**:
   - Choose **Build using Cloud Build**.
   - Runtime: **Node.js** (latest LTS).
   - Build command: `npm install && npm run build`.
   - Start command: `npm start`

> If you change or add scripts in `package.json`, commit and push them to the same branch so Cloud Build can see them.

### 6. Configure the Cloud Run service

In the **Create service** form:

1. **Service name**: `rehearsai-frontend` (or similar).
2. **Region**: choose the same one you used earlier (e.g. `us-central1`).
3. **Authentication**:
   - Select **Allow all traffic**.
   - Select **Allow unauthenticated invocations** (so anyone with the URL can access the app).
4. Click on **Advanced settings → Variables & Secrets → Secrets**:
   - Click **Add secret**.
   - Select the `GEMINI_API_KEY` secret created earlier.
   - Environment variable name: `GEMINI_API_KEY`.
5. (Optional but recommended) In **Autoscaling**:
   - Set **Minimum number of instances** to `0` (to save cost when idle).

Finally, click **Create**. Cloud Build will:

- Fetch the source from your repo.
- Install dependencies and run `npm run build`.
- Build a container image.
- Deploy it to Cloud Run.

This may take a few minutes the first time.

### 7. Get your public URL

Once deployment finishes:

1. Go to **Cloud Run** in the console.
2. Click on the `rehearsai-frontend` service.
3. At the top you will see a **URL** like `https://rehearsai-frontend-xxxxxx-uc.a.run.app`.
4. Open that URL in your browser; you should see the RehearsAI app running in production.

### 8. Configure a custom domain (optional)

To use your own domain (e.g. `app.rehearsai.com`):

1. In the Cloud Console, go to **Cloud Run → your service → Manage custom domains**.
2. Click **Add mapping**.
3. Choose your **domain** (you must verify it in Google Search Console if you have not done so).
4. Follow the instructions to add the required **DNS records** in your domain provider.
5. Wait for DNS propagation (can take up to a few hours). Once ready, your custom domain will point to the Cloud Run service with HTTPS.

