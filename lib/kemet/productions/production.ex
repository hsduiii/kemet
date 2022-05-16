defmodule Kemet.Productions.Production do
  use Ecto.Schema
  import Ecto.Changeset
  alias Kemet.Employees.Employee

  schema "productions" do
    field :capacitor_boxes, :integer
    field :capacitor_type, :string
    field :machine_name, :string
    field :employee_id, :id
    belongs_to :employee, Employee, define_field: false

    timestamps()
  end

  @doc false
  def changeset(production, attrs) do
    production
    |> cast(attrs, [:employee_id, :capacitor_boxes, :capacitor_type, :machine_name])
    |> validate_required([:employee_id, :capacitor_boxes, :capacitor_type, :machine_name])
  end
end
