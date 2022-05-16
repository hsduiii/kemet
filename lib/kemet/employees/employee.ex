defmodule Kemet.Employees.Employee do
  use Ecto.Schema
  import Ecto.Changeset
  alias Kemet.Productions.Production

  schema "employees" do
    field :active, :boolean, default: false
    field :age, :integer
    field :lastname, :string
    field :name, :string
    has_many :productions, Production

    timestamps()
  end

  @doc false
  def changeset(employee, attrs) do
    employee
    |> cast(attrs, [:name, :lastname, :age, :active])
    |> validate_required([:name, :lastname, :age, :active])
  end
end
