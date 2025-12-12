export default function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white shadow">
      <div className="flex items-center space-x-2">
        <img
          src="/plant.png"
          alt="Farm Assistant Logo"
          className="h-8 w-8 object-contain"
        />
        <span className="text-lg font-pacifico text-green-700">
          Farm Assistant
        </span>
      </div>

      <a href="/" className="text-sm text-primary hover:text-primary-hover font-medium">
        ← Về trang chủ
      </a>
    </header>
  );
}
