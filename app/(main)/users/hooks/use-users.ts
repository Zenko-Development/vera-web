"use client";

import { useCallback, useEffect, useState } from "react";
import { roleApi } from "@/entities/role/api/role.api";
import type { Role } from "@/entities/role/model/types";
import { userApi } from "@/entities/user/api/user.api";
import type {
  CreateUserRequest,
  User,
} from "@/entities/user/model/types";
import { ApiError } from "@/shared/api/types";

type UsersSnapshot = {
  users: User[];
  roles: Role[];
};

async function getUsersSnapshot(): Promise<UsersSnapshot> {
  const [users, roles] = await Promise.all([userApi.list(), roleApi.list()]);
  return { users, roles };
}

export function getUsersErrorMessage(error: unknown): string {
  if (ApiError.isApiError(error)) return error.getMessage();
  if (error instanceof Error) return error.message;
  return "Неизвестная ошибка";
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    getUsersSnapshot()
      .then((snapshot) => {
        if (!isActive) return;
        setUsers(snapshot.users);
        setRoles(snapshot.roles);
        setError(null);
      })
      .catch((requestError: unknown) => {
        if (isActive) setError(getUsersErrorMessage(requestError));
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const snapshot = await getUsersSnapshot();
      setUsers(snapshot.users);
      setRoles(snapshot.roles);
      setError(null);
    } catch (requestError) {
      const message = getUsersErrorMessage(requestError);
      setError(message);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createUser = useCallback(async (data: CreateUserRequest) => {
    const createdUser = await userApi.create(data);
    setUsers((current) => [
      createdUser,
      ...current.filter((user) => user.id !== createdUser.id),
    ]);
    return createdUser;
  }, []);

  const updateAccessStatus = useCallback(
    async (id: User["id"], enabled: boolean) => {
      const updatedUser = await userApi.updateAccessStatus(id, {
        acces_status: enabled,
      });

      setUsers((current) =>
        current.map((user) => (user.id === id ? updatedUser : user)),
      );

      return updatedUser;
    },
    [],
  );

  return {
    users,
    roles,
    isLoading,
    error,
    refresh,
    createUser,
    updateAccessStatus,
  };
}
