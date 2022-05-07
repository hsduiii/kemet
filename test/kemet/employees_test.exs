defmodule Kemet.EmployeesTest do
  use Kemet.DataCase

  alias Kemet.Employees

  describe "employees" do
    alias Kemet.Employees.Employee

    import Kemet.EmployeesFixtures

    @invalid_attrs %{active: nil, age: nil, lastname: nil, name: nil}

    test "list_employees/0 returns all employees" do
      employee = employee_fixture()
      assert Employees.list_employees() == [employee]
    end

    test "get_employee!/1 returns the employee with given id" do
      employee = employee_fixture()
      assert Employees.get_employee!(employee.id) == employee
    end

    test "create_employee/1 with valid data creates a employee" do
      valid_attrs = %{active: true, age: 42, lastname: "some lastname", name: "some name"}

      assert {:ok, %Employee{} = employee} = Employees.create_employee(valid_attrs)
      assert employee.active == true
      assert employee.age == 42
      assert employee.lastname == "some lastname"
      assert employee.name == "some name"
    end

    test "create_employee/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Employees.create_employee(@invalid_attrs)
    end

    test "update_employee/2 with valid data updates the employee" do
      employee = employee_fixture()
      update_attrs = %{active: false, age: 43, lastname: "some updated lastname", name: "some updated name"}

      assert {:ok, %Employee{} = employee} = Employees.update_employee(employee, update_attrs)
      assert employee.active == false
      assert employee.age == 43
      assert employee.lastname == "some updated lastname"
      assert employee.name == "some updated name"
    end

    test "update_employee/2 with invalid data returns error changeset" do
      employee = employee_fixture()
      assert {:error, %Ecto.Changeset{}} = Employees.update_employee(employee, @invalid_attrs)
      assert employee == Employees.get_employee!(employee.id)
    end

    test "delete_employee/1 deletes the employee" do
      employee = employee_fixture()
      assert {:ok, %Employee{}} = Employees.delete_employee(employee)
      assert_raise Ecto.NoResultsError, fn -> Employees.get_employee!(employee.id) end
    end

    test "change_employee/1 returns a employee changeset" do
      employee = employee_fixture()
      assert %Ecto.Changeset{} = Employees.change_employee(employee)
    end
  end
end
