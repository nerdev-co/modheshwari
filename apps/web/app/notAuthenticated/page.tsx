"use client";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NotAuthenticated } from "@repo/ui/notAuthenticated";

/**
 * Performs  protected page operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function ProtectedPage() {
    const navigate = useNavigate();

    useEffect(() => {
        const t = setTimeout(() => {
            navigate("/signin");
        }, 2500);

        return () => clearTimeout(t);
    }, [navigate]);

    return <NotAuthenticated />;
}
