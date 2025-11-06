import React from "react";
import { ClientsPage } from "@workspace/ui/pages/clients";
import { createClient } from "@workspace/supabase/client";
import { useNavigate } from "react-router";



export const Clients = () => {

  const supabase = createClient();
  const navigate = useNavigate();

  return (
    <ClientsPage
      supabase={supabase}
      onClick={(client) => navigate(`/dashboard/clients/${client.id}`)}
    />
  );

};