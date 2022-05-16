defmodule KemetWeb.ReportView do
  use KemetWeb, :view

  defp get_produced_boxes(conn) do
    productions = conn.assigns[:productions]
    case length(productions) do
      0 -> 0
      _ ->
          Enum.map(productions , fn production -> production.capacitor_boxes end)
          |> Enum.sum
    end
  end

  defp get_used_machines(conn) do
    productions = conn.assigns[:productions]
    case length(productions) do
      0 -> 0
      _ ->
          Enum.map(productions , fn production -> production.machine_name end)
          |> Enum.uniq()
          |> length()
    end
  end

  defp get_chart_data(conn) do
    productions = conn.assigns[:productions]
    case length(productions) do
      0 -> []
      _ ->
          Enum.map(productions , fn production -> [production.inserted_at, production.capacitor_boxes] end)
          |> Jason.encode!()
    end
  end
end
