// components/admin/LinkPermissionsSelector.tsx
"use client";

import React from "react";
import { PermissionSelector } from "@/components/admin/PermissionSelector";
import { PermissionsConfig } from "@/lib/types";

interface Props {
  permissions: PermissionsConfig;
  onChange: (updated: PermissionsConfig) => void;
}

export const LinkPermissionsSelector: React.FC<Props> = ({ permissions, onChange }) => {
  return <PermissionSelector config={permissions} onChange={onChange} />;
};
