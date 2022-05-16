defmodule KemetWeb.ReportController do
  use KemetWeb, :controller
  alias Kemet.Employees
  alias Kemet.Productions

  def index(conn, _params) do
    employees = Employees.list_active_employees()
    productions = Productions.list_productions()
    render(conn, "index.html", employees: employees, productions: productions)
  end
end
