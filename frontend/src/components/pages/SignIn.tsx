export default function SignIn() {
  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Sign In</h2>
      <form className="space-y-4">
        <input type="email" placeholder="Email" className="w-full border p-2 rounded" />
        <input type="password" placeholder="Password" className="w-full border p-2 rounded" />
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">
          Sign In
        </button>
      </form>
      <div className="mt-4 text-center">
        <p>or</p>
        <button className="w-full border py-2 rounded mt-2">Sign in with Google</button>
        <button className="w-full border py-2 rounded mt-2">Sign in with Microsoft</button>
      </div>
    </div>
  );
}
