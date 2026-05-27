import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { useState } from 'react';

const helpSections = [
  {
    title: 'Registration and Sign Up',
    items: [
      ['How do I create a CloudNest account?', 'Go to the sign up page, enter your full name, email address, and password, then submit the form. After a successful signup, CloudNest creates your personal drive workspace and signs you into the dashboard automatically.'],
      ['What information do I need for signup?', 'You need a name, a valid email address, and a secure password. Your email is used as your login identity, so make sure it is typed correctly before creating the account.'],
      ['What are the password requirements?', 'Your password must be at least eight characters. For better protection, use a mix of uppercase letters, lowercase letters, numbers, and symbols, and avoid passwords you already use on other sites.'],
      ['Why does CloudNest ask for a valid email?', 'CloudNest uses your email to identify your account, prevent duplicate registrations, and support account recovery flows such as password reset or verification when email delivery is enabled.'],
      ['What should I do if signup says the email already exists?', 'That means an account is already registered with that email address. Use the login page with that email, or use forgot password if you do not remember the password.'],
      ['Why did my registration fail?', 'Registration can fail if the email is already used, the password is too short, required fields are empty, the backend is unavailable, or the database could not save the account. Correct the form first, then try again.'],
      ['Does CloudNest verify accounts?', 'CloudNest supports account verification when the deployment has email sending enabled. If verification is active, check your inbox and follow the verification instructions before relying on the account for long-term storage.']
    ]
  },
  {
    title: 'Login and Authentication',
    items: [
      ['How do I log in to CloudNest?', 'Open the login page, enter the same email and password you used during signup, and select Sign In. If your deployment supports Google login, you can also continue with Google.'],
      ['What happens after I log in?', 'CloudNest creates a protected session and redirects you to your dashboard. From there you can upload files, open folders, preview items, search your drive, and manage trash.'],
      ['What does invalid credentials mean?', 'Invalid credentials means the email and password combination did not match an account. Check for spelling mistakes, confirm the email, and make sure your password manager filled the right password.'],
      ['How do I reset a forgotten password?', 'Use the forgot password option from the login page. CloudNest starts the reset flow so you can create a new password and regain access to your account.'],
      ['Why was I logged out automatically?', 'You may be logged out if your session expired, your browser storage was cleared, your account was deleted, or the backend refreshed its security tokens. Log in again to continue.'],
      ['Can I stay signed in on my own device?', 'Yes, your browser can keep the session active while the token remains valid. On shared or public computers, always use Sign Out when you finish.'],
      ['How can I keep my CloudNest account secure?', 'Use a unique password, do not share your login details, sign out on shared devices, and avoid opening suspicious links that claim to be CloudNest login pages.']
    ]
  },
  {
    title: 'Dashboard and File Management',
    items: [
      ['What is the CloudNest dashboard?', 'The dashboard is your main storage workspace. It shows uploaded files and folders, upload controls, search, file categories, storage usage, and quick actions such as preview, share, download, rename, move, copy, and delete.'],
      ['How do I upload files?', 'Use the large upload area in All Files or the upload icon in the topbar. You can drag files into the dropzone or choose files from your device. CloudNest uploads the file to storage and saves its record to your account.'],
      ['Can I upload images and videos?', 'Yes. CloudNest detects images and videos from their file type. Images show thumbnail previews when available, and videos can be previewed through the file preview system.'],
      ['What file types can I store?', 'CloudNest can store common images, videos, PDFs, documents, archives, and general files. Preview support depends on the browser and the stored file type, but the file can still be downloaded even if preview is not available.'],
      ['How do I create folders?', 'Use the folder creation option in the app tools or command palette. Folders help organize uploads and keep related files together inside your workspace.'],
      ['How do I open a folder?', 'Double-click a folder card or use its open action. The dashboard updates to show the files inside that folder while keeping your upload, preview, and file action tools available.'],
      ['How do I search my drive?', 'Use the search bar at the top of the app or the dashboard search field. CloudNest searches file names, original names, extensions, MIME types, categories, and tags so you can quickly find uploads.'],
      ['How do I preview a file?', 'Double-click a supported file or use the preview action. CloudNest opens the preview modal for images, videos, PDFs, text files, and browser-supported media.'],
      ['How do I download a file?', 'Use the download icon on a file card. CloudNest requests a secure download URL from the backend and opens the file in a new browser tab.'],
      ['How do I share a file?', 'Use the share/link icon on the file card. CloudNest creates a public share link when sharing is enabled and copies it to your clipboard.'],
      ['How do I rename a file?', 'Use the rename action on the file card, enter the new name, and confirm. CloudNest updates the file record while keeping the file itself connected to your account.'],
      ['How do I move a file into a folder?', 'Use the move action on the file card, choose the destination folder, and confirm. The file stays in your account but changes its folder location.'],
      ['How do I copy a file?', 'Use the copy action on the file card. CloudNest creates a duplicate file record using the existing stored file data when the backend supports copying.'],
      ['How do I filter Images, Videos, and Documents?', 'Use the sidebar or dashboard category tabs. All Files shows everything, Images shows image uploads, Videos shows video uploads, and Documents shows document or general file types.'],
      ['How is storage usage shown?', 'The sidebar storage card shows your current usage percentage. If your account is close to the limit, use Upgrade to review available plans or remove files you no longer need.'],
      ['What happens if an upload fails?', 'An upload may fail because of a network issue, unsupported size limit, storage provider problem, expired session, or backend error. Refresh your session, check the file, and try uploading again.']
    ]
  },
  {
    title: 'Trash and Recovery',
    items: [
      ['What happens when I delete a file?', 'Deleting a file, image, video, or folder from the dashboard moves it to Trash first. CloudNest does not permanently delete it immediately from the normal delete action.'],
      ['Where can I find deleted files?', 'Open Trash from the lower-left sidebar or from the settings menu. Trash shows deleted items along with their name, type, size, deleted date, remaining cleanup days, and available actions.'],
      ['How long do deleted items stay in Trash?', 'Deleted items stay in Trash for 30 days. During this period, you can restore them or permanently delete them manually.'],
      ['What happens after 30 days?', 'After 30 days, the cleanup logic permanently removes expired trashed items from the database and storage where supported. This keeps your workspace clean and prevents old deleted files from staying forever.'],
      ['How do I restore a deleted file?', 'Open Trash, find the item, and choose Restore. CloudNest removes the trash marker and returns the item to its previous folder location when possible.'],
      ['How do I restore a deleted folder?', 'Open Trash and restore the folder. CloudNest restores the folder and its related folder contents when supported by the backend folder recovery logic.'],
      ['How do I permanently delete something right now?', 'Open Trash and choose Delete on the item. CloudNest asks for confirmation before permanently deleting it because this action cannot be undone.'],
      ['Why is permanent delete dangerous?', 'Permanent delete removes the saved file or folder record and may remove the stored file from cloud storage. Once it is deleted permanently, CloudNest cannot restore it from Trash.'],
      ['Why is my Trash empty?', 'Trash is empty when you have not deleted anything, when all deleted items were restored, or when old items passed the 30-day cleanup period and were permanently removed.']
    ]
  },
  {
    title: 'Account, Settings, and Safety',
    items: [
      ['What can I do from Settings?', 'Settings gives you quick access to Help, Trash, Back to Home Page, and Delete Account. These options connect to the same pages and actions as the sidebar links.'],
      ['How do I sign out?', 'Use the Sign Out icon in the topbar. CloudNest ends your session and returns you to the public area of the site.'],
      ['What does Delete Account do?', 'Delete Account permanently removes your account and connected account data through the backend account deletion flow. CloudNest asks for confirmation first to prevent accidental deletion.'],
      ['Will deleting my account log me out?', 'Yes. After the account deletion succeeds, CloudNest clears the active session and redirects you away from the dashboard.'],
      ['Can I undo account deletion?', 'No. Account deletion is intended to be permanent. Download or move any important files before confirming deletion.'],
      ['Why should I use the Help page?', 'The Help page explains how CloudNest works from signup to file recovery. It is useful when you forget where a feature is, what a file action does, or how Trash protects deleted files.']
    ]
  }
];

export function HelpCenterPage() {
  const [openKey, setOpenKey] = useState(`${helpSections[0].title}-0`);

  return (
    <div className="mx-auto w-full max-w-[1120px] space-y-8 pb-10">
      <header className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
        <div>
          <span className="mb-3 inline-block rounded-full border border-[#4fdbc8]/10 bg-[#4fdbc8]/5 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#4fdbc8]/70">Help Center</span>
          <h1 className="font-display mb-3 text-3xl font-medium text-white/90">CloudNest support guide</h1>
          <p className="text-sm leading-6 text-[#bbcac6]/60">Find clear answers for account setup, login, uploads, folder navigation, previews, search, storage management, deletion, and the 30-day Trash recovery system.</p>
        </div>
        <div className="premium-card rounded-2xl border-white/[0.04] bg-[#0e1513]/35 p-5">
          <div className="flex items-start gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#4fdbc8]/15 bg-[#4fdbc8]/10 text-[#4fdbc8]"><HelpCircle size={22} /></div>
            <div>
              <h2 className="font-display text-lg font-semibold text-white/90">Need a quick path?</h2>
              <p className="mt-2 text-sm leading-6 text-[#bbcac6]/55">Start with Dashboard Usage for uploads, deleting files, restoring from Trash, and finding your content.</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-5">
        {helpSections.map((section) => (
          <section key={section.title} className="premium-card rounded-2xl border-white/[0.04] bg-[#0e1513]/35 p-5">
            <h2 className="font-display text-xl font-semibold text-white/90">{section.title}</h2>
            <div className="mt-4 divide-y divide-white/[0.04]">
              {section.items.map(([question, answer], index) => {
                const key = `${section.title}-${index}`;
                const isOpen = openKey === key;
                return (
                  <div key={question} className="py-1">
                    <button className="flex w-full items-center justify-between gap-4 rounded-lg px-2 py-3 text-left transition hover:bg-white/[0.03]" onClick={() => setOpenKey(isOpen ? '' : key)}>
                      <span className="text-sm font-semibold text-[#dde4e1]">{question}</span>
                      <ChevronDown className={`shrink-0 text-[#4fdbc8] transition duration-200 ${isOpen ? 'rotate-180' : ''}`} size={18} />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: 'easeOut' }} className="overflow-hidden">
                          <p className="px-2 pb-4 text-sm leading-6 text-[#bbcac6]/60">{answer}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
