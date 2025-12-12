const Header: React.FC = () => {
  return (
    <header className="bg-blue-600 text-white p-4 shadow-md">
      <div className="flex items-center space-x-2">
        <img src="/plant.png" alt="Farm Assistant Logo" className="h-8 w-8" />
        <span className="text-lg font-semibold text-green-700">Farm Assistant</span>
      </div>
    </header>
  );
};

export default Header;
