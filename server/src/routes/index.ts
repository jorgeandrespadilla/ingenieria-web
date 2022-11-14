import { BASE_API_URL } from "@/constants/settings";
import { Application } from "express";
import authentication from "./authentication";
import roles from "./roles";
import users from "./users";

export const configureRoutes = (app: Application) => {
    app.use(BASE_API_URL, authentication);
    app.use(BASE_API_URL, users);
    app.use(BASE_API_URL, roles);
}
