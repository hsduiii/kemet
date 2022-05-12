defmodule Kemet.ProductionsTest do
  use Kemet.DataCase

  alias Kemet.Productions

  describe "productions" do
    alias Kemet.Productions.Production

    import Kemet.ProductionsFixtures

    @invalid_attrs %{capacitor_boxes: nil, capacitor_type: nil, machine_name: nil}

    test "list_productions/0 returns all productions" do
      production = production_fixture()
      assert Productions.list_productions() == [production]
    end

    test "get_production!/1 returns the production with given id" do
      production = production_fixture()
      assert Productions.get_production!(production.id) == production
    end

    test "create_production/1 with valid data creates a production" do
      valid_attrs = %{capacitor_boxes: 42, capacitor_type: "some capacitor_type", machine_name: "some machine_name"}

      assert {:ok, %Production{} = production} = Productions.create_production(valid_attrs)
      assert production.capacitor_boxes == 42
      assert production.capacitor_type == "some capacitor_type"
      assert production.machine_name == "some machine_name"
    end

    test "create_production/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Productions.create_production(@invalid_attrs)
    end

    test "update_production/2 with valid data updates the production" do
      production = production_fixture()
      update_attrs = %{capacitor_boxes: 43, capacitor_type: "some updated capacitor_type", machine_name: "some updated machine_name"}

      assert {:ok, %Production{} = production} = Productions.update_production(production, update_attrs)
      assert production.capacitor_boxes == 43
      assert production.capacitor_type == "some updated capacitor_type"
      assert production.machine_name == "some updated machine_name"
    end

    test "update_production/2 with invalid data returns error changeset" do
      production = production_fixture()
      assert {:error, %Ecto.Changeset{}} = Productions.update_production(production, @invalid_attrs)
      assert production == Productions.get_production!(production.id)
    end

    test "delete_production/1 deletes the production" do
      production = production_fixture()
      assert {:ok, %Production{}} = Productions.delete_production(production)
      assert_raise Ecto.NoResultsError, fn -> Productions.get_production!(production.id) end
    end

    test "change_production/1 returns a production changeset" do
      production = production_fixture()
      assert %Ecto.Changeset{} = Productions.change_production(production)
    end
  end
end
