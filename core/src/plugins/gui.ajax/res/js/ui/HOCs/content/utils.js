import * as Actions from '../../Workspaces/editor/actions';
export { Actions }

export const mapStateToProps = (state, props) => ({
    ...state.tabs.filter(({editorData, node}) => editorData.id === props.editorData.id && node.getPath() === props.node.getPath())[0],
    ...props
})