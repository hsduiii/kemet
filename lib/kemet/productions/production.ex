defmodule Kemet.Productions.Production do
  use Ecto.Schema
  import Ecto.Changeset

  schema "productions" do
    field :capacitor_boxes, :integer
    field :capacitor_type, :string
    field :machine_name, :string
    field :employee_id, :id

    timestamps()
  end

  @doc false
  def changeset(production, attrs) do
    production
    |> cast(attrs, [:capacitor_boxes, :capacitor_type, :machine_name])
    |> validate_required([:employee_id, :capacitor_boxes, :capacitor_type, :machine_name])
  end
end
