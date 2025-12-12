

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 text-gray-600 p-4 text-center border-t">
      <p>© {new Date().getFullYear()} My App. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
