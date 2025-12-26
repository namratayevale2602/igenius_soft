import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../lib/axios";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      success: null,

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setSuccess: (success) => set({ success }),

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post("/login", { email, password });
          set({
            user: response.data.user,
            isAuthenticated: true,
            isLoading: false,
            success: "Login successful",
          });
          return response.data;
        } catch (error) {
          set({
            isLoading: false,
            error: error.response?.data?.error || "Login failed",
            success: null,
          });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post("/register", data);
          set({
            user: response.data.user,
            isAuthenticated: true,
            isLoading: false,
            success: "Registration successful",
          });
          return response.data;
        } catch (error) {
          set({
            isLoading: false,
            error: error.response?.data?.error || "Registration failed",
            success: null,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await api.post("/logout");
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            error: null,
            success: "Logged out successfully",
          });
          window.location.href = "/login";
        }
      },

      checkAuth: async () => {
        try {
          const response = await api.get("/check-auth");
          if (response.data.authenticated) {
            set({
              user: response.data.user,
              isAuthenticated: true,
            });
          } else {
            set({
              user: null,
              isAuthenticated: false,
            });
          }
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
          });
        }
      },

      updateUserProfile: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.put(`/user/profile`, data);
          set({
            user: response.data.user,
            isLoading: false,
            success: "Profile updated successfully",
          });
          return response.data;
        } catch (error) {
          set({
            isLoading: false,
            error: error.response?.data?.error || "Update failed",
            success: null,
          });
          throw error;
        }
      },

      clearMessages: () => {
        set({ error: null, success: null });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
