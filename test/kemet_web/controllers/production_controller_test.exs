defmodule KemetWeb.ProductionControllerTest do
  use KemetWeb.ConnCase

  import Kemet.ProductionsFixtures

  @create_attrs %{capacitor_boxes: 42, capacitor_type: "some capacitor_type", machine_name: "some machine_name"}
  @update_attrs %{capacitor_boxes: 43, capacitor_type: "some updated capacitor_type", machine_name: "some updated machine_name"}
  @invalid_attrs %{capacitor_boxes: nil, capacitor_type: nil, machine_name: nil}

  describe "index" do
    test "lists all productions", %{conn: conn} do
      conn = get(conn, Routes.production_path(conn, :index))
      assert html_response(conn, 200) =~ "Listing Productions"
    end
  end

  describe "new production" do
    test "renders form", %{conn: conn} do
      conn = get(conn, Routes.production_path(conn, :new))
      assert html_response(conn, 200) =~ "New Production"
    end
  end

  describe "create production" do
    test "redirects to show when data is valid", %{conn: conn} do
      conn = post(conn, Routes.production_path(conn, :create), production: @create_attrs)

      assert %{id: id} = redirected_params(conn)
      assert redirected_to(conn) == Routes.production_path(conn, :show, id)

      conn = get(conn, Routes.production_path(conn, :show, id))
      assert html_response(conn, 200) =~ "Show Production"
    end

    test "renders errors when data is invalid", %{conn: conn} do
      conn = post(conn, Routes.production_path(conn, :create), production: @invalid_attrs)
      assert html_response(conn, 200) =~ "New Production"
    end
  end

  describe "edit production" do
    setup [:create_production]

    test "renders form for editing chosen production", %{conn: conn, production: production} do
      conn = get(conn, Routes.production_path(conn, :edit, production))
      assert html_response(conn, 200) =~ "Edit Production"
    end
  end

  describe "update production" do
    setup [:create_production]

    test "redirects when data is valid", %{conn: conn, production: production} do
      conn = put(conn, Routes.production_path(conn, :update, production), production: @update_attrs)
      assert redirected_to(conn) == Routes.production_path(conn, :show, production)

      conn = get(conn, Routes.production_path(conn, :show, production))
      assert html_response(conn, 200) =~ "some updated capacitor_type"
    end

    test "renders errors when data is invalid", %{conn: conn, production: production} do
      conn = put(conn, Routes.production_path(conn, :update, production), production: @invalid_attrs)
      assert html_response(conn, 200) =~ "Edit Production"
    end
  end

  describe "delete production" do
    setup [:create_production]

    test "deletes chosen production", %{conn: conn, production: production} do
      conn = delete(conn, Routes.production_path(conn, :delete, production))
      assert redirected_to(conn) == Routes.production_path(conn, :index)

      assert_error_sent 404, fn ->
        get(conn, Routes.production_path(conn, :show, production))
      end
    end
  end

  defp create_production(_) do
    production = production_fixture()
    %{production: production}
  end
end
