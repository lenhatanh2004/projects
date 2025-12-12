
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

const HomePage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow p-4">
        <h2 className="text-xl font-semibold">Welcome to the Home Page</h2>
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
