import React from 'react';
import { message } from 'antd';

import { getUrlParams } from '../../utils';
import { PromotedResultsContext } from '../DataBrowser/PromotedResultsContainer';

class DemoteButton extends React.Component {
	state = {
		isLoading: false,
	};

	deleteQuery = async rule => {
		const { appname } = getUrlParams(window.location.search);
		const { removeResult } = this.context;
		const { item } = this.props;
		try {
			const deleteResponse = await fetch(
				`https://accapi.appbase.io/app/${appname}/rule/${rule}`,
				{
					method: 'DELETE',
					credentials: 'include',
				},
			);
			const deleteObject = await deleteResponse.json();

			this.toggleLoading();
			if (deleteResponse.status >= 400) {
				message.error(deleteObject.message);
			} else {
				removeResult(item._id);
				message.success(deleteObject.message);
			}
		} catch (e) {
			message.error('Something went Wrong!');
		}
	};

	demoteId = async () => {
		this.toggleLoading();
		const { item } = this.props;
		const { rule, queryOperator, searchTerm, appname } = getUrlParams(
			window.location.search,
		);
		const { removeResult } = this.context || undefined;

		const { promotedResults, hiddenResults } = this.context;

		let requestBody = {};

		const filteredResults = promotedResults.filter(
			resultItem => resultItem._id !== item._id,
		);

		if (filteredResults.length === 0 && hiddenResults.length === 0) {
			// We cant send empty then so we remove the query itself
			this.deleteQuery(rule);
		} else {
			const thenBody = {
				promote: [...filteredResults],
			};

			requestBody = {
				if: {
					query: searchTerm,
					operator: queryOperator,
				},
				then: thenBody,
				id: rule,
			};

			// If hidden results are present append it as the Request overwrites the Query Rule data
			if (hiddenResults && hiddenResults.length) {
				requestBody = {
					...requestBody,
					then: {
						...requestBody.then,
						hide: hiddenResults,
					},
				};
			}

			// Remove promote key if not promoted Results are present
			if (filteredResults.length === 0) {
				requestBody = {
					...requestBody,
					then: {
						hide: hiddenResults,
					},
				};
			}

			try {
				const ruleRequest = await fetch(
					`https://accapi.appbase.io/app/${appname}/rule`,
					{
						method: 'POST',
						credentials: 'include',
						body: JSON.stringify(requestBody),
					},
				);

				const ruleResponse = await ruleRequest.json();
				if (ruleRequest.status >= 400) {
					message.error(ruleResponse.message);
				} else {
					message.success('Query Rule Updated!');
					removeResult(item._id);
				}
			} catch (e) {
				message.error('Something went Wrong!');
			}

			this.toggleLoading();
		}
	};

	toggleLoading = () => {
		this.setState(prevState => ({
			isLoading: !prevState.isLoading,
		}));
	};

	render() {
		const { renderButton } = this.props;
		const { isLoading } = this.state;
		return renderButton({
			demoteResult: this.demoteId,
			isLoading,
		});
	}
}

DemoteButton.contextType = PromotedResultsContext;

export default DemoteButton;