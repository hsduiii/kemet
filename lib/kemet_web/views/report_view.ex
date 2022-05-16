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

  defp get_top_employee(conn) do
    productions = conn.assigns[:productions]
    employees = conn.assigns[:employees]
    case length(productions) do
      0 -> "Nadie"
      _ ->
        productions_per_employee = Enum.map(employees, fn employee ->
          employee_productions =
            Enum.filter(productions, fn production -> production.employee.id === employee.id end)
            |> Enum.map(fn production -> production.capacitor_boxes end)
            |> Enum.sum()
          %{name: "#{employee.name} #{employee.lastname}", total: employee_productions}
        end)
        %{name: name, total: total} =
          productions_per_employee
          |> Enum.max_by(& &1.total)

        "#{name} a producido #{total} cajas!"
    end
  end

  defp get_top_capacitor(conn) do
    productions = conn.assigns[:productions]
    case length(productions) do
      0 -> "Ninguno"
      _ ->
        %{capacitor: capacitor, count: _} =
        productions
        |> Enum.map(fn production -> production.capacitor_type end)
        |> Enum.frequencies()
        |> Enum.map(fn {k, v} -> %{capacitor: k, count: v} end)
        |> Enum.max_by(& &1.count)

        "El capacitor más producido es: #{capacitor}"
    end
  end

  defp get_top_machine(conn) do
    productions = conn.assigns[:productions]
    case length(productions) do
      0 -> "Ninguno"
      _ ->
        %{machine: machine, count: count} =
        productions
        |> Enum.map(fn production -> production.machine_name end)
        |> Enum.frequencies()
        |> Enum.map(fn {k, v} -> %{machine: k, count: v} end)
        |> Enum.max_by(& &1.count)

        "La máquina #{machine} a sido usada #{count} veces"
    end
  end
end
