import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">OpenLingua</h1>
      <ul className="flex space-x-6">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/about">About Us</Link></li>
        <li><Link to="/testimonials">Testimonials</Link></li>
        <li><Link to="/signin">Sign In</Link></li>
        <li><Link to="/register">Register</Link></li>
      </ul>
    </nav>
  );
}
