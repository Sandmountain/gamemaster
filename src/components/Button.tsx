import { ButtonProps } from "@mui/material";
import React from "react";
import { Button as MUIButton } from "@mui/material";
export default function Button({ children, ...props }: ButtonProps) {
  return <MUIButton {...props}>{children}</MUIButton>;
}
