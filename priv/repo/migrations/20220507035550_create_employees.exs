defmodule Kemet.Repo.Migrations.CreateEmployees do
  use Ecto.Migration

  def change do
    create table(:employees) do
      add :name, :string
      add :lastname, :string
      add :age, :integer
      add :active, :boolean, default: false, null: false

      timestamps()
    end
  end
end
