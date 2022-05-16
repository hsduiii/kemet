defmodule KemetWeb.ProductionController do
  use KemetWeb, :controller

  alias Kemet.Productions
  alias Kemet.Productions.Production
  alias Kemet.Employees

  def index(conn, _params) do
    productions = Productions.list_productions()
    render(conn, "index.html", productions: productions)
  end

  def new(conn, _params) do
    changeset = Productions.change_production(%Production{})
    employees = Employees.list_active_employees()
    machines = [:aa, :ab, :ac, :ba, :bb, :bc, :ca, :cb, :cc, :ea, :eb, :ec]
    capacitor_types = [:aluminio, :tantalio, :ceramica, :poliester, :polipropileno, :poliestireno, :policarbonato, :plata, :papel]
    render(conn, "new.html", changeset: changeset, employees: employees, machines: machines, capacitor_types: capacitor_types)
  end

  def create(conn, %{"production" => production_params}) do
    case Productions.create_production(production_params) do
      {:ok, production} ->
        conn
        |> put_flash(:info, "Production created successfully.")
        |> redirect(to: Routes.production_path(conn, :show, production))

      {:error, %Ecto.Changeset{} = changeset} ->
        render(conn, "new.html", changeset: changeset)
    end
  end

  def show(conn, %{"id" => id}) do
    production = Productions.get_production!(id)
    render(conn, "show.html", production: production)
  end

  def edit(conn, %{"id" => id}) do
    production = Productions.get_production!(id)
    changeset = Productions.change_production(production)
    employees = Employees.list_active_employees()
    machines = [:aa, :ab, :ac, :ba, :bb, :bc, :ca, :cb, :cc, :ea, :eb, :ec]
    capacitor_types = [:aluminio, :tantalio, :ceramica, :poliester, :polipropileno, :poliestireno, :policarbonato, :plata, :papel]
    render(conn, "edit.html", production: production, changeset: changeset, employees: employees, machines: machines , capacitor_types: capacitor_types)
  end

  def update(conn, %{"id" => id, "production" => production_params}) do
    production = Productions.get_production!(id)

    case Productions.update_production(production, production_params) do
      {:ok, production} ->
        conn
        |> put_flash(:info, "Production updated successfully.")
        |> redirect(to: Routes.production_path(conn, :show, production))

      {:error, %Ecto.Changeset{} = changeset} ->
        render(conn, "edit.html", production: production, changeset: changeset)
    end
  end

  def delete(conn, %{"id" => id}) do
    production = Productions.get_production!(id)
    {:ok, _production} = Productions.delete_production(production)

    conn
    |> put_flash(:info, "Production deleted successfully.")
    |> redirect(to: Routes.production_path(conn, :index))
  end
end
