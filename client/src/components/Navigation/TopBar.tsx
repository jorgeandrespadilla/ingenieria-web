import Button from "components/Button";
import { useAuth } from "hooks/useAuth";
import { NavLink } from "react-router-dom";
import { LinkConfig } from "types/ui";
import NavItem from "./NavItem";

type NavigationProps = {
  title: string;
  links: LinkConfig[];
};

function TopBar({
  title = "",
  links = []
}: NavigationProps) {
  const auth = useAuth();

  const logout = () => {
    auth.logout();
  };

  return (
    <header className="flex flex-row justify-between items-center border-b-2 border-gray-200 px-6 py-4">
      <div className="flex flex-row items-center space-x-10">
        <NavLink to="/">
          <h1 className="font-bold text-xl text-blue-500">{title}</h1>
        </NavLink>
        <ul className="flex flex-row space-x-2">
          {
            links.map((link, index) => (
              <NavItem key={index} to={link.to} icon={link.icon} label={link.label} index={index} />
            ))
          }
        </ul>
      </div>
      <Button onClick={logout}>Cerrar sesión</Button>
    </header>
  );
}

export default TopBar;