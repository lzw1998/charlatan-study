import React, { Component } from "react";
import FinishBoard from "./components/FinishBoard";
import Header from "./components/Header";
import List from "./components/List";
import "./App.css";

export default class App extends Component {
  state = {
    todoList: [],
    finishNums: 0,
    isShowTodoFinishList: true,
  };
  pushTodoList = (newTodo) => {
    const { todoList } = this.state;
    this.setState({ todoList: [newTodo, ...todoList] });
  };
  changeTodoStatus = (id, isFinished) => {
    const todoList = [...this.state.todoList];
    const { finishNums } = this.state;
    this.setState({
      todoList: todoList.map((item) =>
        item.id === id ? { ...item, isFinished: !isFinished } : item
      ),
      finishNums: isFinished ? finishNums - 1 : finishNums + 1,
    });
  };
  changeShow = () => {
    const { isShowTodoFinishList } = this.state;
    this.setState({
      isShowTodoFinishList: !isShowTodoFinishList,
    });
  };
  render() {
    // 传state中除todoList之外的值的方法
    const { todoList, ...remaining } = this.state;
    return (
      <div className="todo-container">
        <Header pushTodoList={this.pushTodoList} />
        <div className="todo-content">
          {todoList.length !== this.state.finishNums && (
            <List
              changeTodoStatus={this.changeTodoStatus}
              todoList={todoList.filter((item) => !item.isFinished)}
            />
          )}

          {this.state.finishNums > 0 && (
            <React.Fragment>
              <FinishBoard
                {...remaining}
                allNums={todoList.length}
                changeShow={this.changeShow}
              />
              {this.state.isShowTodoFinishList && (
                <List
                  changeTodoStatus={this.changeTodoStatus}
                  todoList={todoList.filter((item) => item.isFinished)}
                />
              )}
            </React.Fragment>
          )}
        </div>
      </div>
    );
  }
}
