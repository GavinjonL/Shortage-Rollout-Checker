import { NavLink } from "react-router-dom";
const links = [["/", "Overview"], ["/policy", "Policy Setup"], ["/rollout", "Rollout Review"], ["/simulator", "Flight Simulator"], ["/ripple", "Ripple Map"], ["/shadow", "Shadow Mode"]] as const;
export function Navigation() { return <nav>{links.map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}</nav>; }
