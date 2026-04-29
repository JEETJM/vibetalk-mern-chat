import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Landing from "./pages/Landing";

function App() {
  const path = window.location.pathname;
  const user = JSON.parse(localStorage.getItem("chatUser"));

  if (path === "/login") return <Login />;
  if (path === "/register") return <Register />;

  return user ? <Home /> : <Landing />;
}

export default App;