import { ClientPage } from "@workspace/ui/pages/client";
import React from "react";
import { createClient } from "@workspace/supabase/client";
import { useNavigate, useParams } from "react-router";



export const Client = () => {

  const supabase = createClient();
  const navigate = useNavigate();
  const params = useParams();

  return (
    <ClientPage
      supabase={supabase}
      clientID={params.clientID ?? ""}
      onClick={(project) => navigate(`/dashboard/clients/${project.client_id}/${project.project_number}`)}
    />
  );
};