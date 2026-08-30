# Flip Book

A digital flip book app. Photos stored in Firebase, grouped by trip/occasion tag, displayed with page-turn animation.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Firebase Auth (Google SSO)
- Firestore (photo metadata)
- Firebase Storage (image files)
- `react-pageflip` (animation)

## Setup

### 1. Create Firebase project

Go to [console.firebase.google.com](https://console.firebase.google.com) and create a new project.

Enable the following services:

- **Authentication** → Sign-in method → Google
- **Firestore Database** → Start in production mode
- **Storage** → Start in production mode

### 2. Configure environment variables

Create `.env.local` in the project root:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Fill in values from Firebase Console → Project Settings → Your apps → Web app config.

### 3. Create Firestore composite index

In Firebase Console → Firestore → Indexes → Composite, create:

| Collection | Field 1          | Field 2   | Field 3     |
| ---------- | ---------------- | --------- | ----------- |
| `photos`   | `uploadedBy` ASC | `tag` ASC | `order` ASC |

### 4. Firestore security rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /photos/{photoId} {
      allow read: if request.auth != null
                  && resource.data.uploadedBy == request.auth.uid;
      allow write: if request.auth != null
                   && request.resource.data.uploadedBy == request.auth.uid;
    }
  }
}
```

### 5. Storage security rules

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /photos/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### 6. Run

```bash
npm install
npm run dev
```

## Pages

| Route             | Description                    |
| ----------------- | ------------------------------ |
| `/login`          | Google sign-in                 |
| `/`               | Album grid grouped by tag      |
| `/flipbook/[tag]` | Flip book animation for a tag  |
| `/upload`         | Upload photos and assign a tag |

## Data model

```
photos/{photoId}
  url: string          // Firebase Storage download URL
  tag: string          // album name e.g. "Japan 2024"
  order: number        // position in flip book (0-indexed)
  uploadedBy: string   // user uid
  createdAt: timestamp
```

Each user sees only their own photos. `uploadedBy` is the Firebase Auth uid.
