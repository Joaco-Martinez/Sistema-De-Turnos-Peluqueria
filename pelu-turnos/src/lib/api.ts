import axios from "axios";
import { getApiBaseURL } from "./baseUrl";

export const api = axios.create({
  baseURL: getApiBaseURL(),
  headers: { "Content-Type": "application/json" }
});
