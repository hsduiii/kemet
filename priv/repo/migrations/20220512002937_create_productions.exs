defmodule Kemet.Repo.Migrations.CreateProductions do
  use Ecto.Migration

  def change do
    create table(:productions) do
      add :capacitor_boxes, :integer
      add :capacitor_type, :string
      add :machine_name, :string
      add :employee_id, references(:employees, on_delete: :nothing)

      timestamps()
    end

    create index(:productions, [:employee_id])
  end
end
