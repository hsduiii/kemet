defmodule KemetWeb.ReportController do
  use KemetWeb, :controller
  alias Kemet.Employees
  alias Kemet.Productions

  def index(conn, _params) do
    employees = Employees.list_active_employees()
    productions = Productions.list_productions()
    render(conn, "index.html", employees: employees, productions: productions)
  end


  def export(conn, _params) do
    employees = Employees.list_active_employees()
    productions = Productions.list_productions()

    production_count = case length(productions) do
      0 -> 0
      _ ->
          Enum.map(productions , fn production -> production.capacitor_boxes end)
          |> Enum.sum
    end

    used_machines = case length(productions) do
      0 -> 0
      _ ->
          Enum.map(productions , fn production -> production.machine_name end)
          |> Enum.uniq()
          |> length()
    end

    report = Pdf.build([size: :letter, compress: true], fn pdf ->
      pdf
      |> Pdf.set_info(title: "Reporte #{Date.utc_today()}")
      |> Pdf.set_font("Helvetica", 14)
      |> Pdf.text_at({190, 720}, "Reporte de producción #{Date.utc_today()}")
      |> Pdf.text_at({20, 660}, "Usuarios activos: #{length(employees)}")
      |> Pdf.text_at({20, 640}, "Producción realizada: #{production_count} cajas")
      |> Pdf.text_at({20, 620}, "Máquinas utilizadas: #{used_machines}")
      |> Pdf.text_at({20, 600}, "Empleado más productivo: #{get_top_employee(productions, employees)}")
      |> Pdf.text_at({20, 580}, "Tipo de capacitor más producido: #{get_top_capacitor(productions)}")
      |> Pdf.text_at({20, 560}, "Máquina más usada: #{get_top_machine(productions)}")
      |> Pdf.export()
    end)
    send_download(conn, {:binary, report}, filename: "report.pdf", content_type: "application/pdf")
  end


  defp get_top_employee(productions, employees) do
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

  defp get_top_capacitor(productions) do
    case length(productions) do
      0 -> "Ninguno"
      _ ->
        %{capacitor: capacitor, count: _} =
        productions
        |> Enum.map(fn production -> production.capacitor_type end)
        |> Enum.frequencies()
        |> Enum.map(fn {k, v} -> %{capacitor: k, count: v} end)
        |> Enum.max_by(& &1.count)

        "#{capacitor}"
    end
  end

  defp get_top_machine(productions) do
    case length(productions) do
      0 -> "Ninguno"
      _ ->
        %{machine: machine, count: count} =
        productions
        |> Enum.map(fn production -> production.machine_name end)
        |> Enum.frequencies()
        |> Enum.map(fn {k, v} -> %{machine: k, count: v} end)
        |> Enum.max_by(& &1.count)

        "#{machine} a sido usada #{count} veces"
    end
  end
end
