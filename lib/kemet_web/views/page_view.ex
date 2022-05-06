defmodule KemetWeb.PageView do
  use KemetWeb, :view

  defp get_admin_name(conn) do
    if conn.assigns[:current_admin] do
      conn.assigns[:current_admin].email |> String.replace("@kemet.com.mx", "")
    end
  end
end
