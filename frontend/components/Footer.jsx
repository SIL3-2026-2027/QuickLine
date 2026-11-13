export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-red-600 text-white flex items-center justify-center text-xs font-black">
              Q
            </div>
            <span className="text-xs text-slate-500">
              © 2026 <b className="text-slate-700">QuickLine</b> — Tous droits réservés
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <a href="#" className="hover:text-slate-700">Aide</a>
            <a href="#" className="hover:text-slate-700">Confidentialité</a>
            <a href="#" className="hover:text-slate-700">Contact</a>
          </div>

        </div>
      </div>
    </footer>
  );
}
